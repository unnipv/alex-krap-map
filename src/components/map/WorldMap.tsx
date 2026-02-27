"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { assetPath } from "@/lib/basePath";

// Colors mapping to our thermal severity scale
const severityColors: Record<number, string> = {
    1: "#3b82f6", // Cool blue — Stable
    2: "#eab308", // Warm yellow — Tensions
    3: "#f97316", // Orange — Escalation
    4: "#ef4444", // Hot red — Active Conflict
    5: "#ffffff", // White-hot — Humanitarian Crisis
};

interface WorldMapProps {
    onCountryClick: (iso: string) => void;
    severityData: Record<string, number>;
}

export default function WorldMap({ onCountryClick, severityData }: WorldMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [activeCountry, setActiveCountry] = useState<string | null>(null);
    const severityDataRef = useRef<Record<string, number>>(severityData);
    const mapReady = useRef(false);

    // Keep ref in sync with prop for the map.on("load") callback
    useEffect(() => {
        severityDataRef.current = severityData;
        applyColors();
    }, [severityData]);

    // Build the match expression for choropleth coloring
    function buildColorExpr(data: Record<string, number>): any {
        const entries = Object.entries(data);
        if (entries.length === 0) return "transparent";
        const matchExpr: any[] = ["match", ["get", "ISO3166-1-Alpha-3"]];
        entries.forEach(([iso, severity]) => {
            matchExpr.push(iso, severityColors[severity] || "transparent");
        });
        matchExpr.push("transparent");
        return matchExpr;
    }

    function applyColors() {
        if (!map.current || !mapReady.current) return;
        try {
            map.current.setPaintProperty(
                "countries-fill",
                "fill-color",
                buildColorExpr(severityDataRef.current)
            );
        } catch {
            // Layer may not exist yet
        }
    }

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    "carto-dark": {
                        type: "raster",
                        tiles: [
                            "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
                            "https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
                            "https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
                        ],
                        tileSize: 256,
                    },
                },
                layers: [
                    {
                        id: "carto-dark-layer",
                        type: "raster",
                        source: "carto-dark",
                        minzoom: 0,
                        maxzoom: 22,
                    },
                ],
            },
            center: [10, 25],
            zoom: 1.8,
            minZoom: 1,
            interactive: true,
        });

        map.current.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            "top-right"
        );

        map.current.on("load", () => {
            if (!map.current) return;

            map.current.addSource("countries", {
                type: "geojson",
                data: assetPath("/data/countries.geojson"),
                promoteId: "ISO3166-1-Alpha-3",
            });

            map.current.addLayer({
                id: "countries-fill",
                type: "fill",
                source: "countries",
                paint: {
                    "fill-color": buildColorExpr(severityDataRef.current),
                    "fill-opacity": 0.55,
                },
            });

            // Mark map as ready and apply colors (in case data loaded first)
            mapReady.current = true;
            applyColors();

            map.current.addLayer({
                id: "countries-line",
                type: "line",
                source: "countries",
                paint: {
                    "line-color": "#1e2d3d",
                    "line-width": 0.5,
                    "line-opacity": 0.4,
                },
            });

            map.current.addLayer({
                id: "countries-hover",
                type: "line",
                source: "countries",
                paint: {
                    "line-color": "#d4a017",
                    "line-width": 2,
                    "line-opacity": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        1,
                        0,
                    ],
                },
            });

            let hoveredFeatureId: string | number | null = null;

            map.current.on("mousemove", "countries-fill", (e) => {
                if (!map.current || !e.features?.length) return;
                map.current.getCanvas().style.cursor = "pointer";

                if (hoveredFeatureId !== null) {
                    map.current.setFeatureState(
                        { source: "countries", id: hoveredFeatureId },
                        { hover: false }
                    );
                }

                hoveredFeatureId = e.features[0].id ?? null;
                if (hoveredFeatureId !== null) {
                    map.current.setFeatureState(
                        { source: "countries", id: hoveredFeatureId },
                        { hover: true }
                    );
                }
            });

            map.current.on("mouseleave", "countries-fill", () => {
                if (!map.current) return;
                map.current.getCanvas().style.cursor = "";
                if (hoveredFeatureId !== null) {
                    map.current.setFeatureState(
                        { source: "countries", id: hoveredFeatureId },
                        { hover: false }
                    );
                    hoveredFeatureId = null;
                }
            });

            map.current.on("click", "countries-fill", (e) => {
                if (!e.features?.length) return;
                const feature = e.features[0];
                const iso = feature.properties?.["ISO3166-1-Alpha-3"];
                const name = feature.properties?.name;

                if (iso) {
                    map.current?.flyTo({
                        center: e.lngLat,
                        zoom: 4,
                        duration: 1500,
                        essential: true,
                    });
                    setActiveCountry(iso);
                    onCountryClick(iso);
                }
            });
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Color application is handled by the useEffect above that watches severityData


    const resetView = () => {
        map.current?.flyTo({ center: [10, 25], zoom: 1.8, duration: 1500 });
        setActiveCountry(null);
    };

    return (
        <div className="relative w-full" style={{ height: '100%', minHeight: '500px' }}>
            <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            {/* HUD Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {activeCountry && (
                    <button
                        onClick={resetView}
                        className="bg-[var(--color-bg-tertiary)]/90 border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-amber)] text-[var(--color-text-primary)] px-3 py-2 font-mono text-xs uppercase flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <span className="text-[var(--color-accent-amber)]">◄</span> RETURN
                        TO GLOBAL
                    </button>
                )}
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-4 z-10 bg-[var(--color-bg-secondary)]/90 border border-[var(--color-border-subtle)] p-3 backdrop-blur-sm">
                <div className="text-[10px] font-mono text-[var(--color-text-label)] mb-3 uppercase tracking-widest">
                    [THERMAL_SEVERITY_SCALE]
                </div>
                <div className="flex flex-col gap-1.5 font-mono text-[10px] text-[var(--color-text-secondary)]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-white glow-red" /> HUMANITARIAN CRISIS
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[var(--color-severity-4)] glow-red" />{" "}
                        ACTIVE CONFLICT
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[var(--color-severity-3)] glow-amber" />{" "}
                        ESCALATION
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[var(--color-severity-2)] glow-amber" />{" "}
                        TENSIONS
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[var(--color-severity-1)]" /> STABLE
                    </div>
                </div>
            </div>
        </div>
    );
}

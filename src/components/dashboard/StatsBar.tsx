"use client";

import { useEffect, useState } from "react";
import { assetPath } from "@/lib/basePath";

interface Stats {
    activeConflicts: number;
    countriesInvolved: number;
    civilianCasualtiesYTD: number;
    displacedPeople: string;
    forgottenWar: { name: string; id: string } | null;
    dataRange?: string;
}

export default function StatsBar() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        fetch(assetPath("/data/stats.json"))
            .then((r) => r.json())
            .then(setStats)
            .catch(() => { });
    }, []);

    if (!stats) {
        return (
            <div className="flex gap-3 font-mono text-[10px] uppercase animate-pulse">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-1.5 min-w-[140px]"
                    >
                        <span className="text-[var(--color-text-label)]">Loading...</span>
                        <span className="text-lg text-[var(--color-text-primary)] font-bold">
                            ---
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    const statItems = [
        {
            label: "ACTIVE CONFLICTS",
            value: stats.activeConflicts.toLocaleString(),
            color: "var(--color-accent-red)",
            glow: "glow-red",
        },
        {
            label: "NATIONS ENGAGED",
            value: stats.countriesInvolved.toLocaleString(),
            color: "var(--color-accent-amber)",
            glow: "glow-amber",
        },
        {
            label: "CASUALTIES",
            value: stats.civilianCasualtiesYTD.toLocaleString(),
            color: "var(--color-accent-red)",
            glow: "glow-red",
        },
        {
            label: "DISPLACED",
            value: stats.displacedPeople,
            color: "var(--color-severity-3)",
            glow: "glow-amber",
        },
        {
            label: "⚠ FORGOTTEN WAR",
            value: stats.forgottenWar?.name || "TBD",
            color: "var(--color-text-label)",
            glow: "",
            small: true,
        },
    ];

    return (
        <div className="flex gap-3 font-mono text-[10px] uppercase flex-wrap">
            {statItems.map((item) => (
                <div
                    key={item.label}
                    className={`flex flex-col border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-1.5 min-w-[130px] ${item.glow}`}
                >
                    <span className="text-[var(--color-text-label)] whitespace-nowrap">
                        {item.label}
                    </span>
                    <span
                        className={`${item.small ? "text-sm" : "text-lg"} font-bold whitespace-nowrap`}
                        style={{ color: item.color }}
                    >
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import StatsBar from "@/components/dashboard/StatsBar";

const WorldMap = dynamic(() => import("@/components/map/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-[var(--color-border-subtle)] border-t-[var(--color-accent-amber)] rounded-full animate-spin" />
        <div className="font-mono text-sm text-[var(--color-accent-amber)] animate-pulse">
          INITIALIZING GEO-SPATIAL RENDERER...
        </div>
      </div>
    </div>
  ),
});

interface TimelineEvent {
  date: string;
  type: string;
  location: string;
  fatalities: number;
  actor1: string;
  actor2: string;
  notes: string;
}

interface ConflictSummary {
  id: string;
  name: string;
  countries: string[];
  region: string;
  type: string;
  severity: number;
  totalFatalities: number;
  totalEvents: number;
  earliestDate: string;
  latestEventDate: string;
  eventBreakdown: { type: string; count: number }[];
  topActors: { name: string; count: number }[];
  timeline: TimelineEvent[];
}

const severityLabels: Record<number, string> = {
  1: "STABLE",
  2: "TENSIONS",
  3: "ESCALATION",
  4: "ACTIVE CONFLICT",
  5: "HUMANITARIAN CRISIS",
};

const severityColorClasses: Record<number, string> = {
  1: "text-[var(--color-severity-1)]",
  2: "text-[var(--color-severity-2)]",
  3: "text-[var(--color-severity-3)]",
  4: "text-[var(--color-severity-4)]",
  5: "text-white",
};

export default function Home() {
  const [conflicts, setConflicts] = useState<ConflictSummary[]>([]);
  const [selectedConflict, setSelectedConflict] =
    useState<ConflictSummary | null>(null);
  const [activeTab, setActiveTab] = useState<string>("OVERVIEW");

  useEffect(() => {
    fetch("/data/conflicts.json")
      .then((r) => r.json())
      .then(setConflicts)
      .catch(() => { });
  }, []);

  const handleCountryClick = (iso: string) => {
    const conflict = conflicts.find((c) => c.id === iso);
    if (conflict) {
      setSelectedConflict(conflict);
      setActiveTab("OVERVIEW");
    }
  };

  const tabs = ["OVERVIEW", "TIMELINE", "CASUALTIES", "ECONOMIC", "NEWS"];

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-[var(--color-border-subtle)] z-20 bg-[var(--color-bg-primary)]/95 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-[0.2em] glow-amber text-[var(--color-accent-amber)] leading-tight">
            ALEX KRAP&apos;S WET DREAM
          </h1>
          <div className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-0.5">
            [GLOBAL CONFLICT TRACKER // DATA: JAN 2024 — FEB 2025]
          </div>
        </div>
        <StatsBar />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Map Panel */}
        <div
          className={`transition-all duration-500 ${selectedConflict ? "w-1/2" : "w-full"} relative border-r border-[var(--color-border-subtle)] h-full`}
        >
          <WorldMap onCountryClick={handleCountryClick} />
        </div>

        {/* Conflict Dossier Panel */}
        {selectedConflict && (
          <div className="w-1/2 flex flex-col bg-[var(--color-bg-primary)] overflow-hidden">
            {/* Dossier Header */}
            <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-1">
                    [CONFLICT_DOSSIER]
                  </div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)] uppercase">
                    {selectedConflict.name}
                  </h2>
                  <div className="flex gap-3 mt-1 font-mono text-[10px]">
                    <span
                      className={`${severityColorClasses[selectedConflict.severity]} font-bold`}
                    >
                      ● {severityLabels[selectedConflict.severity]}
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {selectedConflict.type}
                    </span>
                    <span className="text-[var(--color-text-secondary)]">
                      {selectedConflict.region}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConflict(null)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-accent-amber)] font-mono text-xs px-2 py-1 border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-amber)] transition-colors cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${activeTab === tab
                    ? "text-[var(--color-accent-amber)] border-b-2 border-[var(--color-accent-amber)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "OVERVIEW" && (
                <OverviewTab conflict={selectedConflict} />
              )}
              {activeTab === "TIMELINE" && <TimelineTab conflict={selectedConflict} />}
              {activeTab === "CASUALTIES" && (
                <CasualtiesTab conflict={selectedConflict} />
              )}
              {activeTab === "ECONOMIC" && <PlaceholderTab label="ECONOMIC" />}
              {activeTab === "NEWS" && <PlaceholderTab label="NEWS" />}
            </div>
          </div>
        )}

        {/* Conflict List Sidebar (when no conflict is selected) */}
        {!selectedConflict && conflicts.length > 0 && (
          <div className="absolute right-4 top-[80px] w-[320px] max-h-[calc(100vh-120px)] overflow-y-auto z-10 bg-[var(--color-bg-secondary)]/95 border border-[var(--color-border-subtle)] backdrop-blur-sm">
            <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest sticky top-0 bg-[var(--color-bg-secondary)]">
              [ACTIVE_CONFLICTS: {conflicts.length}]
            </div>
            {conflicts.slice(0, 20).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedConflict(c);
                  setActiveTab("OVERVIEW");
                }}
                className="w-full text-left px-3 py-2 border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs text-[var(--color-text-primary)] uppercase">
                    {c.name.replace(" Conflict", "")}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold ${severityColorClasses[c.severity]}`}
                  >
                    ● S{c.severity}
                  </span>
                </div>
                <div className="flex gap-3 font-mono text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                  <span>☠ {c.totalFatalities}</span>
                  <span>⚡ {c.totalEvents} events</span>
                  <span>{c.region}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function OverviewTab({ conflict }: { conflict: ConflictSummary }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Top stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="FATALITIES" value={conflict.totalFatalities.toLocaleString()} color="var(--color-accent-red)" glow="glow-red" />
        <StatCard label="EVENTS" value={conflict.totalEvents.toLocaleString()} color="var(--color-accent-amber)" glow="glow-amber" />
        <StatCard label="SEVERITY" value={`LVL ${conflict.severity} — ${severityLabels[conflict.severity]}`} color={conflict.severity >= 4 ? "var(--color-accent-red)" : "var(--color-accent-amber)"} glow={conflict.severity >= 4 ? "glow-red" : "glow-amber"} />
        <StatCard label="TYPE" value={conflict.type} color="var(--color-text-label)" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
        <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3">
          <div className="text-[var(--color-text-label)] uppercase tracking-widest mb-1">PERIOD</div>
          <div className="text-[var(--color-text-primary)] text-xs">{conflict.earliestDate} → {conflict.latestEventDate}</div>
        </div>
        <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3">
          <div className="text-[var(--color-text-label)] uppercase tracking-widest mb-1">REGION</div>
          <div className="text-[var(--color-text-primary)] text-xs">{conflict.region}</div>
        </div>
      </div>

      {/* Event Breakdown */}
      {conflict.eventBreakdown?.length > 0 && (
        <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3">
          <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-2">
            [EVENT_TYPE_BREAKDOWN]
          </div>
          <div className="flex flex-col gap-1.5">
            {conflict.eventBreakdown.map((eb) => {
              const pct = Math.round((eb.count / conflict.totalEvents) * 100);
              return (
                <div key={eb.type} className="flex items-center gap-2 font-mono text-[11px]">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[var(--color-text-secondary)] truncate">{eb.type}</span>
                    <span className="text-[var(--color-text-label)]">×{eb.count}</span>
                  </div>
                  <div className="w-24 h-1.5 bg-[var(--color-bg-tertiary)] overflow-hidden">
                    <div className="h-full bg-[var(--color-accent-amber)]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[var(--color-text-secondary)] w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Actors */}
      {conflict.topActors?.length > 0 && (
        <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3">
          <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-2">
            [KEY_ACTORS]
          </div>
          <div className="flex flex-col gap-1">
            {conflict.topActors.map((actor, i) => (
              <div key={i} className="flex justify-between items-center font-mono text-[11px]">
                <span className="text-[var(--color-text-primary)] truncate mr-2">{actor.name}</span>
                <span className="text-[var(--color-text-label)] whitespace-nowrap">{actor.count} mentions</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, glow }: { label: string; value: string; color: string; glow?: string }) {
  return (
    <div className={`border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3 ${glow || ""}`}>
      <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-1">{label}</div>
      <div className="font-bold text-sm uppercase" style={{ color }}>{value}</div>
    </div>
  );
}

function CasualtiesTab({ conflict }: { conflict: ConflictSummary }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4 glow-red">
        <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-2">[FATALITY_COUNTER]</div>
        <div className="text-4xl font-bold text-[var(--color-accent-red)] font-mono">{conflict.totalFatalities.toLocaleString()}</div>
        <div className="text-xs text-[var(--color-text-secondary)] font-mono mt-1">REPORTED FATALITIES // {conflict.earliestDate} — {conflict.latestEventDate}</div>
      </div>
      <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
        <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-2">[EVENT_COUNT]</div>
        <div className="text-2xl font-bold text-[var(--color-accent-amber)] font-mono">{conflict.totalEvents.toLocaleString()}</div>
        <div className="text-xs text-[var(--color-text-secondary)] font-mono mt-1">RECORDED CONFLICT EVENTS</div>
      </div>

      {/* Event breakdown as casualty context */}
      {conflict.eventBreakdown?.length > 0 && (
        <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4">
          <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-2">[VIOLENCE_TYPES]</div>
          {conflict.eventBreakdown.filter(e => e.type.includes("Violence") || e.type.includes("Battle") || e.type.includes("Explosion")).map((eb) => (
            <div key={eb.type} className="flex justify-between font-mono text-xs text-[var(--color-text-primary)] py-1 border-b border-[var(--color-border-subtle)] last:border-0">
              <span>{eb.type}</span>
              <span className="text-[var(--color-accent-red)]">{eb.count} events</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const eventTypeColors: Record<string, string> = {
  "Battles": "#ef4444",
  "Violence against civilians": "#f97316",
  "Explosions/Remote violence": "#eab308",
  "Protests": "#3b82f6",
  "Riots": "#8b5cf6",
  "Strategic developments": "#6b7280",
};

function TimelineTab({ conflict }: { conflict: ConflictSummary }) {
  const events = conflict.timeline || [];
  if (events.length === 0) {
    return (
      <div className="border border-dashed border-[var(--color-border-subtle)] p-6 text-center">
        <div className="font-mono text-xs text-[var(--color-text-secondary)]">[NO SIGNIFICANT EVENTS IN DATASET]</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="font-mono text-[10px] text-[var(--color-text-label)] uppercase tracking-widest mb-3">
        [{events.length} SIGNIFICANT EVENTS]
      </div>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[6px] top-0 bottom-0 w-px bg-[var(--color-border-subtle)]" />

        {events.map((event, i) => (
          <div key={i} className="relative pl-6 pb-4 group">
            {/* Timeline dot */}
            <div
              className="absolute left-0 top-1 w-[13px] h-[13px] rounded-full border-2"
              style={{
                borderColor: eventTypeColors[event.type] || "#6b7280",
                backgroundColor: event.fatalities > 0 ? (eventTypeColors[event.type] || "#6b7280") : "transparent",
              }}
            />

            <div className="border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-3 hover:border-[var(--color-accent-amber)] transition-colors">
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono text-[10px] text-[var(--color-text-label)]">{event.date}</span>
                {event.fatalities > 0 && (
                  <span className="font-mono text-[10px] text-[var(--color-accent-red)] font-bold">☠ {event.fatalities}</span>
                )}
              </div>
              <div className="font-mono text-[11px] text-[var(--color-text-primary)] mb-1">
                <span style={{ color: eventTypeColors[event.type] || "#6b7280" }}>{event.type}</span>
                {" — "}{event.location}
              </div>
              <div className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {event.actor1}{event.actor2 ? ` vs ${event.actor2}` : ""}
              </div>
              {event.notes && (
                <div className="font-mono text-[10px] text-[var(--color-text-secondary)] mt-1 opacity-70 leading-relaxed">
                  {event.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-[var(--color-border-subtle)] p-6 text-center">
      <div className="font-mono text-xs text-[var(--color-text-secondary)]">[{label}_MODULE: COMING SOON]</div>
    </div>
  );
}

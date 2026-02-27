export type Region = "Africa" | "Middle East" | "Asia" | "Europe" | "Americas";

export type ConflictType =
    | "Interstate War"
    | "Civil War"
    | "Insurgency"
    | "Cartel/Gang Violence"
    | "Political Violence"
    | "Protests/Riots"
    | "Unknown";

export type SimpleTier =
    | "Active War"
    | "Armed Conflict"
    | "Escalation"
    | "Tensions"
    | "Stable";

export interface ConflictEvent {
    id: string;
    date: string;
    type: string;
    sub_type: string;
    actor1: string;
    actor2: string;
    location: string;
    country: string;
    fatalities: number;
    latitude: number;
    longitude: number;
    source: string;
    notes: string;
}

export interface Article {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    thumbnail?: string;
}

export interface Conflict {
    id: string; // ISO3 country code generally, or composite for cross-border
    name: string;
    countries: string[];
    region: Region;
    type: ConflictType;
    simpleTier: SimpleTier;
    severity: number; // 1 to 5
    totalFatalities: number;
    totalEvents: number;
    startDate: string; // Earliest event in our window
    latestEventDate: string; // Most recent event
    mediaAttentionScore: number; // Normalized 0-100
    articles: Article[];
    events: ConflictEvent[];
    coordinates: [number, number]; // [lng, lat] for map centering (optional if we center on poly)
}

export interface GlobalStats {
    activeConflicts: number;
    countriesInvolved: number;
    civilianCasualtiesYTD: number;
    displacedPeople: string; // E.g., "117.3M"
    forgottenWar: {
        name: string;
        id: string;
    } | null;
}

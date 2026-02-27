import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { fetchRecentEvents } from '../src/lib/data/acled';
import { fetchConflictNews } from '../src/lib/data/gnews';
import { getSanctionsForCountry } from '../src/lib/data/opensanctions';
import { ConflictEvent, Region, NewsArticle } from '../src/lib/types';

// Delay helper to avoid hitting API rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Map country names to ISO3 codes (partial — expand as needed)
const countryToISO3: Record<string, string> = {
    "Afghanistan": "AFG", "Albania": "ALB", "Algeria": "DZA", "Angola": "AGO",
    "Argentina": "ARG", "Armenia": "ARM", "Azerbaijan": "AZE", "Bangladesh": "BGD",
    "Belarus": "BLR", "Benin": "BEN", "Bolivia": "BOL", "Bosnia-Herzegovina": "BIH",
    "Brazil": "BRA", "Burkina Faso": "BFA", "Burundi": "BDI", "Cambodia": "KHM",
    "Cameroon": "CMR", "Central African Republic": "CAF", "Chad": "TCD", "Chile": "CHL",
    "China": "CHN", "Colombia": "COL", "Democratic Republic of Congo": "COD",
    "Republic of Congo": "COG", "Cuba": "CUB", "Djibouti": "DJI",
    "Ecuador": "ECU", "Egypt": "EGY", "El Salvador": "SLV", "Eritrea": "ERI",
    "Ethiopia": "ETH", "France": "FRA", "Gabon": "GAB", "Gambia": "GMB",
    "Georgia": "GEO", "Germany": "DEU", "Ghana": "GHA", "Guatemala": "GTM",
    "Guinea": "GIN", "Guinea-Bissau": "GNB", "Haiti": "HTI", "Honduras": "HND",
    "India": "IND", "Indonesia": "IDN", "Iran": "IRN", "Iraq": "IRQ",
    "Israel": "ISR", "Italy": "ITA", "Ivory Coast": "CIV", "Japan": "JPN",
    "Jordan": "JOR", "Kazakhstan": "KAZ", "Kenya": "KEN", "Kosovo": "XKX",
    "Kuwait": "KWT", "Kyrgyzstan": "KGZ", "Laos": "LAO", "Lebanon": "LBN",
    "Lesotho": "LSO", "Liberia": "LBR", "Libya": "LBY", "Madagascar": "MDG",
    "Malawi": "MWI", "Malaysia": "MYS", "Mali": "MLI", "Mauritania": "MRT",
    "Mexico": "MEX", "Moldova": "MDA", "Mongolia": "MNG", "Morocco": "MAR",
    "Mozambique": "MOZ", "Myanmar": "MMR", "Namibia": "NAM", "Nepal": "NPL",
    "Nicaragua": "NIC", "Niger": "NER", "Nigeria": "NGA", "North Korea": "PRK",
    "Pakistan": "PAK", "Palestine": "PSE", "Panama": "PAN", "Papua New Guinea": "PNG",
    "Paraguay": "PRY", "Peru": "PER", "Philippines": "PHL", "Poland": "POL",
    "Romania": "ROU", "Russia": "RUS", "Rwanda": "RWA", "Saudi Arabia": "SAU",
    "Senegal": "SEN", "Sierra Leone": "SLE", "Somalia": "SOM", "South Africa": "ZAF",
    "South Korea": "KOR", "South Sudan": "SSD", "Spain": "ESP", "Sri Lanka": "LKA",
    "Sudan": "SDN", "Sweden": "SWE", "Syria": "SYR", "Tajikistan": "TJK",
    "Tanzania": "TZA", "Thailand": "THA", "Togo": "TGO", "Tunisia": "TUN",
    "Turkey": "TUR", "Turkmenistan": "TKM", "Uganda": "UGA", "Ukraine": "UKR",
    "United Arab Emirates": "ARE", "United Kingdom": "GBR", "United States of America": "USA",
    "Uruguay": "URY", "Uzbekistan": "UZB", "Venezuela": "VEN", "Vietnam": "VNM",
    "Yemen": "YEM", "Zambia": "ZMB", "Zimbabwe": "ZWE",
};

// Map country to region
const countryToRegion: Record<string, Region> = {};
const africaCountries = ["Algeria", "Angola", "Benin", "Burkina Faso", "Burundi", "Cameroon", "Central African Republic", "Chad", "Democratic Republic of Congo", "Republic of Congo", "Djibouti", "Egypt", "Eritrea", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Senegal", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"];
const middleEastCountries = ["Afghanistan", "Iran", "Iraq", "Israel", "Jordan", "Kuwait", "Lebanon", "Palestine", "Saudi Arabia", "Syria", "Turkey", "United Arab Emirates", "Yemen"];
const asiaCountries = ["Bangladesh", "Cambodia", "China", "India", "Indonesia", "Japan", "Kazakhstan", "Kyrgyzstan", "Laos", "Malaysia", "Mongolia", "Myanmar", "Nepal", "North Korea", "Pakistan", "Papua New Guinea", "Philippines", "South Korea", "Sri Lanka", "Tajikistan", "Thailand", "Turkmenistan", "Uzbekistan", "Vietnam"];
const europeCountries = ["Albania", "Armenia", "Azerbaijan", "Belarus", "Bosnia-Herzegovina", "France", "Georgia", "Germany", "Italy", "Kosovo", "Moldova", "Poland", "Romania", "Russia", "Spain", "Sweden", "Ukraine", "United Kingdom"];
const americasCountries = ["Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Haiti", "Honduras", "Mexico", "Nicaragua", "Panama", "Paraguay", "Peru", "United States of America", "Uruguay", "Venezuela"];

africaCountries.forEach(c => countryToRegion[c] = "Africa");
middleEastCountries.forEach(c => countryToRegion[c] = "Middle East");
asiaCountries.forEach(c => countryToRegion[c] = "Asia");
europeCountries.forEach(c => countryToRegion[c] = "Europe");
americasCountries.forEach(c => countryToRegion[c] = "Americas");

function computeSeverity(fatalities: number, events: number): number {
    // Simple heuristic: weighted score based on fatalities and event count
    const score = (fatalities * 2) + events;
    if (score > 1000) return 5; // White-hot
    if (score > 500) return 4;  // Hot red
    if (score > 100) return 3;  // Orange
    if (score > 20) return 2;   // Yellow
    return 1;                    // Cool blue
}

async function run() {
    console.log("Starting data pipeline...");

    // Fetch ACLED data — using date range within the 12-month restriction window
    // Free tier can only access data older than 12 months from today
    console.log("Fetching ACLED events (Jan 2024 - Feb 2025)...");
    let events: ConflictEvent[];
    try {
        events = await fetchRecentEvents("2024-01-01", "2025-02-01");
        console.log(`Fetched ${events.length} events from ACLED.`);
    } catch (err) {
        console.error("Failed to fetch ACLED data:", err);
        process.exit(1);
    }

    // Aggregate by country — rich stats
    const countryAgg: Record<string, {
        events: number; fatalities: number; latestDate: string; earliestDate: string;
        eventTypes: Record<string, number>; actors: Record<string, number>;
        timeline: { date: string; type: string; location: string; fatalities: number; actor1: string; actor2: string; notes: string }[];
    }> = {};

    events.forEach(e => {
        if (!countryAgg[e.country]) {
            countryAgg[e.country] = {
                events: 0, fatalities: 0, latestDate: e.date, earliestDate: e.date,
                eventTypes: {}, actors: {}, timeline: [],
            };
        }
        const agg = countryAgg[e.country];
        agg.events++;
        agg.fatalities += e.fatalities;
        agg.eventTypes[e.type] = (agg.eventTypes[e.type] || 0) + 1;
        if (e.actor1) agg.actors[e.actor1] = (agg.actors[e.actor1] || 0) + 1;
        if (e.actor2) agg.actors[e.actor2] = (agg.actors[e.actor2] || 0) + 1;
        if (e.date > agg.latestDate) agg.latestDate = e.date;
        if (e.date < agg.earliestDate) agg.earliestDate = e.date;

        // Keep significant events for timeline (fatalities > 0 or notable event types)
        if (e.fatalities > 0 || e.type === "Battles" || e.type === "Explosions/Remote violence") {
            agg.timeline.push({
                date: e.date, type: e.type, location: e.location,
                fatalities: e.fatalities, actor1: e.actor1, actor2: e.actor2,
                notes: e.notes?.substring(0, 200) || "",
            });
        }
    });

    // Build severity map
    const severityByISO: Record<string, number> = {};
    const severityByCountry: Record<string, number> = {};

    Object.entries(countryAgg).forEach(([country, stats]) => {
        const severity = computeSeverity(stats.fatalities, stats.events);
        severityByCountry[country] = severity;
        const iso = countryToISO3[country];
        if (iso) severityByISO[iso] = severity;
    });

    // Build rich conflicts list
    const conflicts = Object.entries(countryAgg)
        .filter(([, stats]) => stats.fatalities > 0 || stats.events > 10)
        .map(([country, stats]) => {
            // Sort timeline by date
            stats.timeline.sort((a, b) => a.date.localeCompare(b.date));

            // Top 5 actors by mention count
            const topActors = Object.entries(stats.actors)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count]) => ({ name, count }));

            // Event type breakdown
            const eventBreakdown = Object.entries(stats.eventTypes)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => ({ type, count }));

            // Determine conflict type more carefully
            let conflictType = "Unknown";
            if (stats.eventTypes["Battles"] && stats.eventTypes["Battles"] > 5) conflictType = "Armed Conflict";
            else if (stats.eventTypes["Violence against civilians"]) conflictType = "Political Violence";
            else if (stats.eventTypes["Protests"] || stats.eventTypes["Riots"]) conflictType = "Protests/Riots";
            else if (stats.eventTypes["Explosions/Remote violence"]) conflictType = "Insurgency";
            else if (stats.eventTypes["Strategic developments"]) conflictType = "Tensions";

            return Object.assign({
                id: countryToISO3[country] || country,
                name: `${country}`,
                countries: [country],
                region: countryToRegion[country] || "Africa" as Region,
                type: conflictType,
                severity: severityByCountry[country],
                totalFatalities: stats.fatalities,
                totalEvents: stats.events,
                earliestDate: stats.earliestDate,
                latestEventDate: stats.latestDate,
                eventBreakdown,
                topActors,
                timeline: stats.timeline.slice(-50), // Last 50 events for the timeline
            }, { articles: [] as NewsArticle[], economicImpact: null as any }); // Initialize empty properties that we'll populate below
        })
        .sort((a, b) => b.totalFatalities - a.totalFatalities);

    // Fetch sanctions data for all tracked conflicts
    console.log("Mapping OpenSanctions economic impact profiles...");
    for (const conflict of conflicts) {
        // Map the ISO code via our static adapter
        conflict.economicImpact = await getSanctionsForCountry(conflict.id);
    }

    // Fetch news for the top 15 deadliest conflicts (to stay well within 100 req/day limit)
    console.log("Fetching live GNews articles for top conflicts...");
    const topConflicts = conflicts.slice(0, 15);
    for (const conflict of topConflicts) {
        console.log(`  - Fetching news for: ${conflict.name}`);
        const query = `"${conflict.name}" AND (conflict OR war OR violence OR military OR crisis)`;
        const articles = await fetchConflictNews(query, 5);
        conflict.articles = articles;
        // Wait 1.5 seconds between requests to respect max 1 req/sec limit
        await delay(1500);
    }

    // Global stats
    const totalFatalities = events.reduce((sum, e) => sum + e.fatalities, 0);
    const countriesWithConflict = Object.keys(countryAgg).filter(c => countryAgg[c].fatalities > 0);

    const stats = {
        activeConflicts: conflicts.length,
        countriesInvolved: countriesWithConflict.length,
        civilianCasualtiesYTD: totalFatalities,
        displacedPeople: "117.3M",
        forgottenWar: null as { name: string; id: string } | null,
        dataRange: "Jan 2024 - Feb 2025",
    };

    // Ensure output dir
    const dataDir = path.resolve(__dirname, '../public/data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    // Write data files
    fs.writeFileSync(path.join(dataDir, 'stats.json'), JSON.stringify(stats, null, 2));
    fs.writeFileSync(path.join(dataDir, 'severity.json'), JSON.stringify(severityByISO, null, 2));
    fs.writeFileSync(path.join(dataDir, 'conflicts.json'), JSON.stringify(conflicts, null, 2));

    console.log(`Pipeline complete! ${conflicts.length} conflicts, ${events.length} events, ${Object.keys(severityByISO).length} countries mapped.`);
    console.log("Top 5 deadliest:");
    conflicts.slice(0, 5).forEach(c => console.log(`  ${c.name}: ${c.totalFatalities} fatalities, ${c.totalEvents} events, ${c.topActors.length} actors`));
}

run().catch(console.error);

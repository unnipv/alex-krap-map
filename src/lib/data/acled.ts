import { ConflictEvent } from "../types";

let accessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAcledToken(): Promise<string> {
    if (accessToken && Date.now() < tokenExpiresAt) {
        return accessToken;
    }

    const username = process.env.ACLED_USERNAME;
    const password = process.env.ACLED_PASSWORD;

    if (!username || !password) {
        throw new Error("ACLED_USERNAME and ACLED_PASSWORD environment variables are required.");
    }

    const response = await fetch("https://acleddata.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            username,
            password,
            grant_type: "password",
            client_id: "acled",
        }),
    });

    if (!response.ok) {
        throw new Error(`ACLED auth failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;
    return accessToken!;
}

export async function fetchRecentEvents(
    startDate: string = "2024-01-01",
    endDate: string = "2025-02-01"
): Promise<ConflictEvent[]> {
    const token = await getAcledToken();
    const dateStr = `${startDate}|${endDate}`;

    // Only fetch significant armed conflict events, skip protests/riots/minor incidents
    const eventTypes = "Battles|Explosions/Remote violence|Violence against civilians";

    const PAGE_SIZE = 5000;
    const MAX_EVENTS = 50000; // Safety cap
    let page = 1;
    let allEvents: ConflictEvent[] = [];
    let hasMore = true;

    while (hasMore) {
        const url = `https://acleddata.com/api/acled/read?limit=${PAGE_SIZE}&page=${page}&event_date=${dateStr}&event_date_where=BETWEEN&event_type=${encodeURIComponent(eventTypes)}&event_type_where=IN`;

        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error(`ACLED fetch failed (page ${page}): ${response.status} ${await response.text()}`);
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            hasMore = false;
            break;
        }

        const events = data.data.map((item: any) => ({
            id: item.event_id_cnty,
            date: item.event_date,
            type: item.event_type,
            sub_type: item.sub_event_type,
            actor1: item.actor1,
            actor2: item.actor2,
            location: item.location,
            country: item.country,
            fatalities: parseInt(item.fatalities, 10) || 0,
            latitude: parseFloat(item.latitude),
            longitude: parseFloat(item.longitude),
            source: item.source,
            notes: item.notes,
        }));

        allEvents = allEvents.concat(events);
        console.log(`  Page ${page}: fetched ${events.length} events (total: ${allEvents.length})`);

        if (events.length < PAGE_SIZE || allEvents.length >= MAX_EVENTS) {
            hasMore = false;
        } else {
            page++;
        }
    }

    return allEvents;
}

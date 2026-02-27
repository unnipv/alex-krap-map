/**
 * Fetches total GDELT media volume for a given conflict or country query
 * GDELT API is free and does not require keys.
 * Using DOC API 2.0
 */
export async function fetchGdeltVolume(query: string, days: number = 7): Promise<number> {
    // We use GDELT DOC API volume timeline to get total article volume
    // See: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

    // Format query for GDELT
    const formattedQuery = encodeURIComponent(query);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${formattedQuery}&mode=TimelineVol&timespan=${days}d&format=json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`GDELT fetch failed for ${query}`);
            return 0;
        }

        const data = await response.json();
        if (!data || !data.timeline || !data.timeline.length) {
            return 0;
        }

        // The TimelineVol returns series data representing percent of total news volume
        // We sum it up to get a relative total volume proxy score
        const series = data.timeline[0].data;
        const totalVolumeScores = series.reduce((acc: number, item: any) => acc + item.value, 0);

        return totalVolumeScores;
    } catch (err) {
        console.error(`GDELT api error loop for ${query}:`, err);
        return 0;
    }
}

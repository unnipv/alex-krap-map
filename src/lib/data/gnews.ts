import * as dotenv from 'dotenv';
import path from 'path';

// Resolve project root for .env.local
// __dirname here is src/lib/data, so root is ../../../
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";

export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    image: string;
    publishedAt: string;
    source: {
        name: string;
        url: string;
    };
}

/**
 * Fetches recent news articles for a given conflict or country.
 * GNews Free Tier allows 100 requests per day, max 10 articles per request.
 * 
 * @param query The search query (e.g., "Sudan AND conflict")
 * @param maxArticles Maximum number of articles to return (max 10 for free tier)
 */
export async function fetchConflictNews(query: string, maxArticles: number = 5): Promise<NewsArticle[]> {
    if (!GNEWS_API_KEY) {
        console.warn("⚠️ GNEWS_API_KEY is not set. Skipping news fetch.");
        return [];
    }

    try {
        // Construct the URL with query parameters
        // 'lang=en' ensures we get English articles, 'sortby=publishedAt' gets the latest
        const url = new URL(GNEWS_BASE_URL);
        url.searchParams.append("q", query);
        url.searchParams.append("lang", "en");
        url.searchParams.append("sortby", "publishedAt");
        url.searchParams.append("max", maxArticles.toString());
        url.searchParams.append("apikey", GNEWS_API_KEY);

        const response = await fetch(url.toString());

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GNews API Error: ${response.status} - ${errorData.errors ? errorData.errors.join(', ') : response.statusText}`);
        }

        const data = await response.json();

        if (!data.articles) {
            return [];
        }

        return data.articles as NewsArticle[];

    } catch (error) {
        console.error(`Failed to fetch news for query "${query}":`, error);
        return []; // Return empty array on failure so pipeline doesn't crash
    }
}

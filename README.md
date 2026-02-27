# Alex Krap's Wet Dream: Global Conflict Tracker

A high-performance, real-time war and geopolitical conflict tracker with a "DEFCON" terminal aesthetic. It aggregates and normalizes data from the ACLED API, GNews API, and OpenSanctions logic to provide a unified surveillance dashboard of every active conflict worldwide.

## Features
- **Thermal Mapping**: Real-time severity map generated via MapLibre GL JS.
- **Data Pipeline**: Automated Github Actions cron job that builds new conflict data daily without risking API limits in the client.
- **Conflict Dossiers**: Detailed breakdowns of fatalities, actors, events timeline, sanctions, and live news monitoring.
- **Performant Architecture**: 100% static frontend querying cached JSON files for near-instant load times.

## Setup Instructions
1. Clone the repository and run `npm install`
2. Configure `.env.local` to include:
    ```
    GNEWS_API_KEY=your_key_here
    ```
3. Run the development server: `npm run dev`

### Automated Pipeline (GitHub Actions)
The repository includes a GitHub Actions workflow (`deploy.yml`) that runs daily at midnight UTC to fetch the latest global incident data and deploy a fresh static build to GitHub Pages.

To enable the automated data fetching in this pipeline:
1. Go to your GitHub Repository -> Settings -> Secrets and variables -> Actions
2. Add the following **Repository secrets**:
   - `GNEWS_API_KEY`
   - `ACLED_USERNAME`
   - `ACLED_PASSWORD`

### Building Data Locally
To fetch the latest pipeline data locally during development, run:
`npx tsx scripts/fetch-data.ts`

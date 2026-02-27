import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

export interface SanctionData {
    armsEmbargo: boolean;
    financialSanctions: boolean;
    travelBans: boolean;
    description?: string;
}

/**
 * Maps an ISO-3 country code to active global sanctions.
 * Since OpenSanctions requires dealing with large data dumps or a paid API for real-time complex queries, 
 * this is a lightweight programmatic mapping of currently known major embargoes to simulate the pipeline for the MVP.
 * In production, this would parse the OpenSanctions generic CSV dump daily.
 */
export async function getSanctionsForCountry(iso3: string): Promise<SanctionData> {
    // Dictionary of heavily sanctioned countries for the prototype pipeline.
    // This provides realistic data for our highest-severity conflicts.
    const knownSanctions: Record<string, SanctionData> = {
        'RUS': {
            armsEmbargo: true,
            financialSanctions: true,
            travelBans: true,
            description: "Comprehensive western sanctions targeting financial sectors, tech exports, and oligarchs."
        },
        'SYR': {
            armsEmbargo: true,
            financialSanctions: true,
            travelBans: true,
            description: "Extensive US (Caesar Act) and EU sanctions targeting the regime and affiliated entities."
        },
        'PRK': {
            armsEmbargo: true,
            financialSanctions: true,
            travelBans: true,
            description: "UN Security Council and comprehensive international sanctions regarding nuclear proliferation."
        },
        'IRN': {
            armsEmbargo: true,
            financialSanctions: true,
            travelBans: true,
            description: "Extensive financial, trade, and targeted individual sanctions led by the US and EU."
        },
        'MMR': {
            armsEmbargo: true,
            financialSanctions: true,
            travelBans: true,
            description: "Targeted sanctions against the military junta and military-owned enterprises."
        },
        'SDN': {
            armsEmbargo: true,
            financialSanctions: false,
            travelBans: true,
            description: "Targeted sanctions against key belligerent leaders and related business networks."
        },
        'VEN': {
            armsEmbargo: true,
            financialSanctions: true,
            travelBans: true,
            description: "Sectoral sanctions targeting state oil infrastructure and government officials."
        },
        'COD': {
            armsEmbargo: true, // Specifically for non-governmental forces
            financialSanctions: false,
            travelBans: true,
            description: "UN and US targeted sanctions against rebel leaders and armed group commanders."
        },
        'SOM': {
            armsEmbargo: true,
            financialSanctions: false,
            travelBans: true,
            description: "UN sanctions primarily focused on preventing arms flow to militant groups."
        },
        'YEM': {
            armsEmbargo: true,
            financialSanctions: true,
            travelBans: true,
            description: "Targeted UN and US sanctions against key figures in the conflict."
        },
        'PSE': {
            armsEmbargo: false,
            financialSanctions: true,
            travelBans: true,
            description: "Targeted Western sanctions against key militant organizations and affiliated financial networks."
        },
        'UKR': {
            armsEmbargo: false,
            financialSanctions: false,
            travelBans: false,
            description: "Major trade disruptions and supply chain volatility due to ongoing wartime infrastructure strain, though no international sanctions against the state itself."
        }
    };

    if (knownSanctions[iso3]) {
        return knownSanctions[iso3];
    }

    // Default for countries without major blanket sanctions
    return {
        armsEmbargo: false,
        financialSanctions: false,
        travelBans: false,
        description: undefined
    };
}

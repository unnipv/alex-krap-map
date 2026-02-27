// Resolves asset path for both dev (/) and production (/alex-krap-map/)
export function getBasePath(): string {
    return process.env.NODE_ENV === "production" ? "/alex-krap-map" : "";
}

export function assetPath(path: string): string {
    return `${getBasePath()}${path}`;
}

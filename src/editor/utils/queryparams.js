const url = new URL(location.href);

export const quality = url.searchParams.get("quality") || "high";

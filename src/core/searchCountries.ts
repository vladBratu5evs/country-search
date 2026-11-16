import { HttpError } from "./searchErrors.js";

export async function searchCountries(
  query: string,
  signal: AbortSignal,
): Promise<unknown[]> {
  const response = await fetch(
    `https://countries.dev/name/${encodeURIComponent(query)}`,
    { signal },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText);
  }

  const countries: unknown = await response.json();
  if (!Array.isArray(countries)) {
    throw new Error("Expected the country search response to be an array.");
  }

  return countries;
}

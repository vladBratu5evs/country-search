export async function searchCountries(
  query: string,
  signal: AbortSignal,
): Promise<unknown[]> {
  const response = await fetch(
    `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}`,
    { signal },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(
      `Country search failed: ${response.status} ${response.statusText}`,
    );
  }

  const countries: unknown = await response.json();
  if (!Array.isArray(countries)) {
    throw new Error("Expected the country search response to be an array.");
  }

  return countries;
}

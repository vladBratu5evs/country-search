export type CountryCardData = {
  name: string;
  description: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
  area: number | null;
  borders: string[];
  currency: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapCountryResponse(raw: unknown): CountryCardData {
  if (!isRecord(raw)) {
    throw new Error("Expected the country response to be an object.");
  }

  const { name, capital, region, population, languages, area, borders } = raw;
  const flags = isRecord(raw.flags) ? raw.flags : undefined;
  const flag =
    typeof flags?.svg === "string"
      ? flags.svg
      : typeof flags?.png === "string"
        ? flags.png
        : undefined;

  if (
    typeof name !== "string" ||
    typeof flag !== "string" ||
    typeof region !== "string" ||
    typeof population !== "number"
  ) {
    throw new Error("Country response is missing required card data.");
  }

  const currency = Array.isArray(raw.currencies)
    ? raw.currencies
        .flatMap((value) => {
          if (
            !isRecord(value) ||
            typeof value.code !== "string" ||
            typeof value.name !== "string"
          ) {
            return [];
          }

          const symbol =
            typeof value.symbol === "string" ? `, ${value.symbol}` : "";
          return [`${value.name} (${value.code}${symbol})`];
        })
        .join(", ")
    : "";

  return {
    name,
    description: name,
    flag,
    capital: typeof capital === "string" ? capital : "",
    region,
    population,
    languages: Array.isArray(languages)
      ? languages.flatMap((language) =>
          isRecord(language) && typeof language.name === "string"
            ? [language.name]
            : [],
        )
      : [],
    area: typeof area === "number" ? area : null,
    borders: Array.isArray(borders)
      ? borders.filter((border): border is string => typeof border === "string")
      : [],
    currency,
  };
}

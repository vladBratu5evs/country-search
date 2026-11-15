type CountryCardData = {
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

export function mapCountryResponse(raw: string): CountryCardData {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error("Expected the country response to be an object.");
  }

  const countryName = isRecord(parsed.name) ? parsed.name : undefined;
  const name = countryName?.common;
  const description =
    typeof countryName?.official === "string" ? countryName.official : name;
  const flag = isRecord(parsed.flags) ? parsed.flags.svg : undefined;
  const { capital, region, population, languages, area, borders, currencies } =
    parsed;

  if (
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof flag !== "string" ||
    typeof region !== "string" ||
    typeof population !== "number"
  ) {
    throw new Error("Country response is missing required card data.");
  }

  const currency = isRecord(currencies)
    ? Object.entries(currencies)
        .flatMap(([code, value]) => {
          if (!isRecord(value) || typeof value.name !== "string") {
            return [];
          }

          const symbol =
            typeof value.symbol === "string" ? `, ${value.symbol}` : "";
          return [`${value.name} (${code}${symbol})`];
        })
        .join(", ")
    : "";

  return {
    name,
    description,
    flag,
    capital:
      Array.isArray(capital) && typeof capital[0] === "string"
        ? capital[0]
        : "",
    region,
    population,
    languages: isRecord(languages)
      ? Object.values(languages).filter(
          (language): language is string => typeof language === "string",
        )
      : [],
    area: typeof area === "number" ? area : null,
    borders: Array.isArray(borders)
      ? borders.filter((border): border is string => typeof border === "string")
      : [],
    currency,
  };
}

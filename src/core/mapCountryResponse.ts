type CountryCardData = {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapCountryResponse(raw: string): CountryCardData {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error("Expected the country response to be an object.");
  }

  const name = isRecord(parsed.name) ? parsed.name.common : undefined;
  const flag = isRecord(parsed.flags) ? parsed.flags.svg : undefined;
  const { capital, region, population, languages } = parsed;

  if (
    typeof name !== "string" ||
    typeof flag !== "string" ||
    typeof region !== "string" ||
    typeof population !== "number"
  ) {
    throw new Error("Country response is missing required card data.");
  }

  return {
    name,
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
  };
}

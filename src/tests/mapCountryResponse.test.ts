import { describe, expect, it } from "vitest";
import { mapCountryResponse } from "../core/mapCountryResponse.js";

describe("mapCountryResponse", () => {
  it("maps country API data to card fields", () => {
    const raw = {
      name: "Canada",
      flag: "🇨🇦",
      flags: {
        png: "https://flagcdn.com/w320/ca.png",
        svg: "https://flagcdn.com/ca.svg",
      },
      capital: "Ottawa",
      region: "Americas",
      population: 38929902,
      languages: [
        { iso639_1: "en", name: "English" },
        { iso639_1: "fr", name: "French" },
      ],
      area: 9984670,
      borders: ["USA"],
      currencies: [{ code: "CAD", name: "Canadian dollar", symbol: "$" }],
    };

    expect(mapCountryResponse(raw)).toEqual({
      name: "Canada",
      description: "Canada",
      flag: "https://flagcdn.com/ca.svg",
      capital: "Ottawa",
      region: "Americas",
      population: 38929902,
      languages: ["English", "French"],
      area: 9984670,
      borders: ["USA"],
      currency: "Canadian dollar (CAD, $)",
    });
  });

  it("uses empty values when capital and languages are missing", () => {
    const raw = {
      name: "Nauru",
      flag: "🇳🇷",
      flags: {
        png: "https://flagcdn.com/w320/nr.png",
      },
      region: "Oceania",
      population: 10834,
    };

    expect(mapCountryResponse(raw)).toEqual({
      name: "Nauru",
      description: "Nauru",
      flag: "https://flagcdn.com/w320/nr.png",
      capital: "",
      region: "Oceania",
      population: 10834,
      languages: [],
      area: null,
      borders: [],
      currency: "",
    });
  });
});

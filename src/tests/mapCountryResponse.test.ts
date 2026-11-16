import { describe, expect, it } from "vitest";
import { mapCountryResponse } from "../core/mapCountryResponse.js";

describe("mapCountryResponse", () => {
  it("maps country API data to card fields", () => {
    const raw = {
      name: "Canada",
      flag: "https://countries.dev/flags/ca.svg",
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
      flag: "https://countries.dev/flags/ca.svg",
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
      flag: "https://countries.dev/flags/nr.svg",
      region: "Oceania",
      population: 10834,
    };

    expect(mapCountryResponse(raw)).toEqual({
      name: "Nauru",
      description: "Nauru",
      flag: "https://countries.dev/flags/nr.svg",
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

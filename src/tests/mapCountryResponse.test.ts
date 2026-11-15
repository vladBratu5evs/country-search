import { describe, expect, it } from "vitest";
import { mapCountryResponse } from "../core/mapCountryResponse.js";

describe("mapCountryResponse", () => {
  it("maps country API data to card fields", () => {
    const raw = JSON.stringify({
      name: { common: "Canada", official: "Canada" },
      flags: { svg: "canada.svg" },
      capital: ["Ottawa", "Toronto"],
      region: "Americas",
      population: 38929902,
      languages: { eng: "English", fra: "French" },
      area: 9984670,
      borders: ["USA"],
      currencies: { CAD: { name: "Canadian dollar", symbol: "$" } },
    });

    expect(mapCountryResponse(raw)).toEqual({
      name: "Canada",
      description: "Canada",
      flag: "canada.svg",
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
    const raw = JSON.stringify({
      name: { common: "Nauru", official: "Republic of Nauru" },
      flags: { svg: "nauru.svg" },
      region: "Oceania",
      population: 10834,
    });

    expect(mapCountryResponse(raw)).toEqual({
      name: "Nauru",
      description: "Republic of Nauru",
      flag: "nauru.svg",
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

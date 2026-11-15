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
    });

    expect(mapCountryResponse(raw)).toEqual({
      name: "Canada",
      flag: "canada.svg",
      capital: "Ottawa",
      region: "Americas",
      population: 38929902,
      languages: ["English", "French"],
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
      flag: "nauru.svg",
      capital: "",
      region: "Oceania",
      population: 10834,
      languages: [],
    });
  });
});

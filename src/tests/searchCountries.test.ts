import { afterEach, describe, expect, it, vi } from "vitest";
import { searchCountries } from "../core/searchCountries.js";

describe("searchCountries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the query with the provided abort signal and returns the countries", async () => {
    const query = "canada";
    const signal = new AbortController().signal;
    const countries = [{ name: { common: "Canada" } }];
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(countries), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchCountries(query, signal)).resolves.toEqual(countries);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(query),
      expect.objectContaining({ signal }),
    );
  });

  it("returns an empty array when no countries are found", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchCountries("unknown", new AbortController().signal),
    ).resolves.toEqual([]);
  });

  it.each([400, 429])(
    "rejects when fetch responds with HTTP %i",
    async (status) => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        searchCountries("canada", new AbortController().signal),
      ).rejects.toThrow();
    },
  );
});

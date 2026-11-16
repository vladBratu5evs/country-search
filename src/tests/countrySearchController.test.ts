import { afterEach, describe, expect, it, vi } from "vitest";
import { createCountrySearchController } from "../core/countrySearchController.js";

describe("createCountrySearchController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aborts an earlier fetch and ignores its late response", async () => {
    const pending = new Map<string, (response: Response) => void>();
    const signals = new Map<string, AbortSignal>();
    const fetchEvents: string[] = [];
    const abortErrors: Error[] = [];
    const fetchMock = vi.fn<typeof fetch>((input, init) => {
      const query = decodeURIComponent(
        new URL(String(input)).pathname.split("/").at(-1) ?? "",
      );
      const signal = init?.signal;

      if (!signal) {
        throw new Error("Expected fetch to receive an AbortSignal.");
      }

      signals.set(query, signal);

      return new Promise<Response>((resolve, reject) => {
        const rejectAsAborted = () => {
          const error = Object.assign(new Error("Request cancelled"), {
            name: "AbortError",
          });
          abortErrors.push(error);
          fetchEvents.push(`abort:${query}`);
          reject(error);
        };

        if (signal.aborted) {
          rejectAsAborted();
          return;
        }

        signal.addEventListener("abort", rejectAsAborted, { once: true });
        pending.set(query, (response) => {
          if (signal.aborted) {
            fetchEvents.push(`late-response:${query}`);
            return;
          }
          fetchEvents.push(`resolve:${query}`);
          resolve(response);
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const controller = createCountrySearchController(() => {});
    const earlierRequest = controller.search("can");
    const laterRequest = controller.search("canada");

    const makeResponse = (name: string) =>
      new Response(
        JSON.stringify([
          {
            name: { common: name, official: name },
            flags: { svg: `${name}.svg` },
            region: "Americas",
            population: 1,
          },
        ]),
        { headers: { "Content-Type": "application/json" } },
      );

    pending.get("canada")?.(makeResponse("Canada"));
    await laterRequest;

    pending.get("can")?.(makeResponse("Canary Islands"));
    await earlierRequest;

    expect(abortErrors).toHaveLength(1);
    expect(abortErrors[0]).toMatchObject({ name: "AbortError" });
    expect(signals.get("can")?.aborted).toBe(true);
    expect(fetchEvents).toEqual([
      "abort:can",
      "resolve:canada",
      "late-response:can",
    ]);
    expect(controller.getState().countries.map(({ name }) => name)).toEqual([
      "Canada",
    ]);
  });

  it("clears results and skips fetch for an empty query", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const controller = createCountrySearchController(() => {});

    await controller.search("   ");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(controller.getState()).toMatchObject({
      status: "idle",
      query: "",
      countries: [],
      error: null,
    });
  });

  it("treats a 404 response as an empty result state", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = createCountrySearchController(() => {});

    await controller.search("unknown");

    expect(controller.getState()).toMatchObject({
      status: "empty",
      query: "unknown",
      countries: [],
      error: null,
    });
  });

  it("retries the same query after an HTTP error", async () => {
    const countries = [
      {
        name: { common: "Canada", official: "Canada" },
        flags: { svg: "canada.svg" },
        region: "Americas",
        population: 38929902,
      },
    ];
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(countries), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const controller = createCountrySearchController(() => {});

    await controller.search("canada");
    expect(controller.getState()).toMatchObject({
      status: "error",
      query: "canada",
      error: "http",
    });

    await controller.retry();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("canada"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(controller.getState().countries.map(({ name }) => name)).toEqual([
      "Canada",
    ]);
  });
});

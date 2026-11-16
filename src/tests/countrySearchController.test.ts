import { afterEach, describe, expect, it, vi } from "vitest";
import { createCountrySearchController } from "../core/countrySearchController.js";

describe("createCountrySearchController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aborts an active request immediately when the input changes", async () => {
    let activeSignal: AbortSignal | undefined;
    const fetchMock = vi.fn<typeof fetch>((_input, init) => {
      const signal = init?.signal;
      if (!signal) {
        throw new Error("Expected fetch to receive an AbortSignal.");
      }
      activeSignal = signal;
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            reject(
              Object.assign(new Error("Request cancelled"), {
                name: "AbortError",
              }),
            );
          },
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const controller = createCountrySearchController(() => {});

    const activeSearch = controller.search("can");
    controller.inputChanged("canad");

    expect(activeSignal?.aborted).toBe(true);
    expect(controller.getState()).toMatchObject({
      status: "idle",
      query: "canad",
      countries: [],
      error: null,
    });
    await activeSearch;
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
            name,
            flag: "🇨🇦",
            flags: { svg: `https://flagcdn.com/${name}.svg` },
            capital: "",
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

  it("shows only the last result when fetch responses resolve in reverse order", async () => {
    const pending = new Map<
      string,
      { signal: AbortSignal; resolve: (response: Response) => void }
    >();
    const outcomes: string[] = [];
    const abortErrors: Error[] = [];
    const fetchMock = vi.fn<typeof fetch>((input, init) => {
      const query = decodeURIComponent(
        new URL(String(input)).pathname.split("/").at(-1) ?? "",
      );
      const signal = init?.signal;

      if (!signal) {
        throw new Error("Expected fetch to receive an AbortSignal.");
      }

      return new Promise<Response>((resolve, reject) => {
        const rejectAsAborted = () => {
          const error = Object.assign(new Error("Request cancelled"), {
            name: "AbortError",
          });
          abortErrors.push(error);
          outcomes.push(`abort:${query}`);
          reject(error);
        };

        if (signal.aborted) {
          rejectAsAborted();
          return;
        }

        signal.addEventListener("abort", rejectAsAborted, { once: true });
        pending.set(query, {
          signal,
          resolve: (response) => {
            if (signal.aborted) {
              outcomes.push(`late-response:${query}`);
              return;
            }
            outcomes.push(`resolve:${query}`);
            resolve(response);
          },
        });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const controller = createCountrySearchController(() => {});
    const earlierRequest = controller.search("can");
    const latestRequest = controller.search("canada");
    const makeResponse = (name: string) =>
      new Response(
        JSON.stringify([
          {
            name,
            flag: "🇨🇦",
            flags: { svg: `https://flagcdn.com/${name}.svg` },
            capital: "",
            region: "Americas",
            population: 1,
          },
        ]),
        { headers: { "Content-Type": "application/json" } },
      );

    const latestFetch = pending.get("canada");
    const earlierFetch = pending.get("can");
    if (!latestFetch || !earlierFetch) {
      throw new Error("Expected both fetch requests to be pending.");
    }

    latestFetch.resolve(makeResponse("Canada"));
    await latestRequest;
    earlierFetch.resolve(makeResponse("Canary Islands"));
    await earlierRequest;

    expect(outcomes).toEqual([
      "abort:can",
      "resolve:canada",
      "late-response:can",
    ]);
    expect(earlierFetch.signal.aborted).toBe(true);
    expect(abortErrors[0]).toMatchObject({ name: "AbortError" });
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
        name: "Canada",
        flag: "🇨🇦",
        flags: { svg: "https://flagcdn.com/ca.svg" },
        capital: "Ottawa",
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

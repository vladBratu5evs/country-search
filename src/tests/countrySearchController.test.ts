import { afterEach, describe, expect, it, vi } from "vitest";
import { createCountrySearchController } from "../core/countrySearchController.js";

describe("createCountrySearchController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the latest results when an earlier request resolves afterward", async () => {
    const pending = new Map<string, (response: Response) => void>();
    const signals = new Map<string, AbortSignal>();
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
          reject(
            Object.assign(new Error("Request cancelled"), {
              name: "AbortError",
            }),
          );
        };

        if (signal.aborted) {
          rejectAsAborted();
          return;
        }

        signal.addEventListener("abort", rejectAsAborted, { once: true });
        pending.set(query, resolve);
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

    expect(signals.get("can")?.aborted).toBe(true);
    expect(controller.getState().countries.map(({ name }) => name)).toEqual([
      "Canada",
    ]);
  });
});

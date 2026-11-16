import { describe, expect, it } from "vitest";
import { classifySearchError } from "../core/searchErrors.js";

describe("classifySearchError", () => {
  it("classifies an AbortError as an abort", () => {
    const error = Object.assign(new Error("Request cancelled"), {
      name: "AbortError",
    });

    expect(classifySearchError(error)).toBe("abort");
  });

  it("classifies a TimeoutError as a timeout", () => {
    const error = Object.assign(new Error("Request timed out"), {
      name: "TimeoutError",
    });

    expect(classifySearchError(error)).toBe("timeout");
  });

  it("classifies an HttpError as an HTTP error", () => {
    const error = Object.assign(new Error("Too Many Requests"), {
      name: "HttpError",
      status: 429,
    });

    expect(classifySearchError(error)).toBe("http");
  });

  it("classifies other failures as unknown", () => {
    expect(classifySearchError(new Error("Network unavailable"))).toBe(
      "unknown",
    );
  });
});

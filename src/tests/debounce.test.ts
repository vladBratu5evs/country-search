import { afterEach, describe, expect, it, vi } from "vitest";
import { debounce } from "../core/debounce.js";

describe("debounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a function", () => {
    const debouncedFn = debounce(() => {}, 100);
    expect(typeof debouncedFn).toBe("function");
  });

  it("should reset the timer when called again before the delay expires", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 100);

    debouncedFn();
    vi.advanceTimersByTime(75);
    debouncedFn();

    vi.advanceTimersByTime(25);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(75);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should invoke once with the latest arguments after repeated calls", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debouncedFn = debounce(callback, 100);

    debouncedFn("first");
    vi.advanceTimersByTime(50);
    debouncedFn("latest");
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("latest");
  });
});

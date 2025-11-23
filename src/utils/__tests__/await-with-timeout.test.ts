import { awaitWithTimeout } from "../await-with-timeout";

describe("awaitWithTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves with the underlying promise value when it settles before the timeout", async () => {
    const promise = new Promise<number>((resolve) =>
      setTimeout(() => resolve(42), 20)
    );

    const resultPromise = awaitWithTimeout(promise, 100);

    jest.advanceTimersByTime(20);

    await expect(resultPromise).resolves.toBe(42);
  });

  it("returns the onTimeout result when the timeout fires first", async () => {
    const fallback = jest.fn().mockReturnValue("fallback");
    const neverResolves = new Promise<string>(() => {
      /* intentionally empty */
    });

    const resultPromise = awaitWithTimeout(
      neverResolves,
      50,
      fallback
    );

    jest.advanceTimersByTime(50);

    await expect(resultPromise).resolves.toBe("fallback");
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("rejects with a timeout error when no onTimeout handler is provided", async () => {
    const neverResolves = new Promise<never>(() => {
      /* intentionally empty */
    });

    const resultPromise = awaitWithTimeout(neverResolves, 25);

    jest.advanceTimersByTime(25);

    await expect(resultPromise).rejects.toThrow("Operation timed out.");
  });
});

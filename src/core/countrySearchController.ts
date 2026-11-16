import {
  mapCountryResponse,
  type CountryCardData,
} from "./mapCountryResponse.js";
import { classifySearchError, type SearchErrorKind } from "./searchErrors.js";
import { searchCountries } from "./searchCountries.js";

const requestTimeoutMs = 15_000;

export type CountrySearchState = {
  status: "idle" | "loading" | "empty" | "results" | "error";
  query: string;
  countries: CountryCardData[];
  error: SearchErrorKind | null;
};

export function createCountrySearchController(
  onStateChange: (state: CountrySearchState) => void,
) {
  let state: CountrySearchState = {
    status: "idle",
    query: "",
    countries: [],
    error: null,
  };
  let activeRequest: AbortController | undefined;
  let latestRequestId = 0;
  let lastQuery = "";

  const publish = (nextState: CountrySearchState) => {
    state = nextState;
    onStateChange(state);
  };

  const search = async (query: string): Promise<void> => {
    const normalizedQuery = query.trim();
    lastQuery = normalizedQuery;
    const requestId = ++latestRequestId;

    activeRequest?.abort();
    activeRequest = undefined;

    if (!normalizedQuery) {
      publish({
        status: "idle",
        query: "",
        countries: [],
        error: null,
      });
      return;
    }

    const abortController = new AbortController();
    activeRequest = abortController;
    const signal = AbortSignal.any([
      abortController.signal,
      AbortSignal.timeout(requestTimeoutMs),
    ]);

    publish({
      status: "loading",
      query: normalizedQuery,
      countries: [],
      error: null,
    });

    let nextState: CountrySearchState;
    try {
      const rawCountries = await searchCountries(normalizedQuery, signal);
      const countries = rawCountries.map(mapCountryResponse);

      nextState = {
        status: countries.length === 0 ? "empty" : "results",
        query: normalizedQuery,
        countries,
        error: null,
      };
    } catch (error) {
      if (requestId !== latestRequestId) {
        return;
      }

      const errorKind = classifySearchError(error);
      if (errorKind === "abort") {
        if (activeRequest === abortController) {
          activeRequest = undefined;
        }
        return;
      }

      nextState = {
        status: "error",
        query: normalizedQuery,
        countries: [],
        error: errorKind,
      };
    }

    if (requestId !== latestRequestId) {
      return;
    }

    if (activeRequest === abortController) {
      activeRequest = undefined;
    }
    publish(nextState);
  };

  const inputChanged = (query: string): void => {
    const normalizedQuery = query.trim();
    latestRequestId += 1;
    lastQuery = normalizedQuery;
    activeRequest?.abort();
    activeRequest = undefined;

    publish({
      status: "idle",
      query: normalizedQuery,
      countries: [],
      error: null,
    });
  };

  return {
    search,
    inputChanged,
    retry: () => (lastQuery ? search(lastQuery) : Promise.resolve()),
    getState: () => state,
    dispose: () => {
      latestRequestId += 1;
      activeRequest?.abort();
      activeRequest = undefined;
    },
  };
}

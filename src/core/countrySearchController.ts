export type CountrySearchState = {
  status: "idle" | "loading" | "empty" | "results" | "error";
  query: string;
  countries: Array<{ name: string }>;
  error: "abort" | "timeout" | "http" | "unknown" | null;
};

export function createCountrySearchController(
  onStateChange: (state: CountrySearchState) => void,
) {
  void onStateChange;
  const state: CountrySearchState = {
    status: "idle",
    query: "",
    countries: [],
    error: null,
  };

  return {
    search(query: string): Promise<void> {
      void query;
      return Promise.resolve();
    },
    retry(): Promise<void> {
      return Promise.resolve();
    },
    getState(): CountrySearchState {
      return state;
    },
  };
}

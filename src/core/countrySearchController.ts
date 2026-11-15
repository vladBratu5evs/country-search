export type CountrySearchState = {
  status: "idle" | "loading" | "empty" | "results" | "error";
  query: string;
  countries: Array<{ name: string }>;
};

export function createCountrySearchController(
  onStateChange: (state: CountrySearchState) => void,
) {
  void onStateChange;
  const state: CountrySearchState = {
    status: "idle",
    query: "",
    countries: [],
  };

  return {
    search(query: string): Promise<void> {
      void query;
      return Promise.resolve();
    },
    getState(): CountrySearchState {
      return state;
    },
  };
}

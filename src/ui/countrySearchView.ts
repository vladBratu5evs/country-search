import { debounce } from "../core/debounce.js";
import {
  createCountrySearchController,
  type CountrySearchState,
} from "../core/countrySearchController.js";
import type { CountryCardData } from "../core/mapCountryResponse.js";

const debounceDelayMs = 350;

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function addDetail(details: HTMLDListElement, label: string, value: string) {
  const term = createElement("dt", undefined, label);
  const description = createElement("dd", undefined, value);
  details.append(term, description);
}

function formatPopulation(population: number): string {
  return new Intl.NumberFormat().format(population);
}

export function mountCountrySearch(root: HTMLElement): () => void {
  const title = createElement("h1", "page-title", "Country Search");
  const searchLabel = createElement("label", "search-label", "Find a country");
  const input = createElement("input", "search-input");
  input.type = "search";
  input.id = "country-query";
  input.name = "country";
  input.autocomplete = "off";
  input.placeholder = "Try Canada or Japan";
  searchLabel.htmlFor = input.id;

  const status = createElement("p", "search-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const retryButton = createElement("button", "retry-button", "Retry");
  retryButton.type = "button";
  retryButton.hidden = true;

  const results = createElement("ul", "country-list");
  results.setAttribute("aria-label", "Country search results");

  const detailsView = createElement("section", "country-details");
  detailsView.setAttribute("aria-live", "polite");

  root.replaceChildren(
    title,
    searchLabel,
    input,
    status,
    retryButton,
    results,
    detailsView,
  );

  let selectedCountry: CountryCardData | undefined;
  let disposed = false;
  const controller = createCountrySearchController(render);

  function renderDetails(country: CountryCardData) {
    const backButton = createElement(
      "button",
      "back-button",
      "Back to results",
    );
    backButton.type = "button";
    backButton.addEventListener("click", () => {
      selectedCountry = undefined;
      render(controller.getState());
    });

    const heading = createElement("h2", "details-title", country.name);
    const flag = createElement("img", "details-flag");
    flag.src = country.flag;
    flag.alt = `Flag of ${country.name}`;
    flag.loading = "lazy";

    const details = createElement("dl", "details-list");
    addDetail(details, "Description", country.description);
    addDetail(details, "Capital", country.capital || "Not available");
    addDetail(details, "Region", country.region);
    addDetail(details, "Population", formatPopulation(country.population));
    addDetail(
      details,
      "Area",
      country.area === null
        ? "Not available"
        : `${formatPopulation(country.area)} km²`,
    );
    addDetail(
      details,
      "Borders",
      country.borders.length > 0 ? country.borders.join(", ") : "None",
    );
    addDetail(
      details,
      "Languages",
      country.languages.length > 0
        ? country.languages.join(", ")
        : "Not available",
    );
    addDetail(details, "Currency", country.currency || "Not available");

    detailsView.replaceChildren(backButton, heading, flag, details);
  }

  function renderCountryCard(country: CountryCardData): HTMLLIElement {
    const item = createElement("li", "country-list-item");
    const button = createElement("button", "country-card");
    button.type = "button";

    const flag = createElement("img", "country-flag");
    flag.src = country.flag;
    flag.alt = `Flag of ${country.name}`;
    flag.loading = "lazy";

    const content = createElement("span", "country-card-content");
    const name = createElement("span", "country-name", country.name);
    const capital = createElement(
      "span",
      "country-summary",
      `Capital: ${country.capital || "Not available"}`,
    );
    const region = createElement("span", "country-summary", country.region);
    const population = createElement(
      "span",
      "country-summary",
      `Population: ${formatPopulation(country.population)}`,
    );
    content.append(name, capital, region, population);
    button.append(flag, content);
    button.addEventListener("click", () => {
      selectedCountry = country;
      render(controller.getState());
    });
    item.append(button);
    return item;
  }

  function render(state: CountrySearchState) {
    results.replaceChildren();
    detailsView.replaceChildren();
    results.setAttribute("aria-busy", String(state.status === "loading"));
    retryButton.hidden = state.status !== "error";

    if (selectedCountry && state.status === "results") {
      renderDetails(selectedCountry);
      return;
    }

    switch (state.status) {
      case "idle":
        status.textContent = state.query
          ? "Waiting to search…"
          : "Enter a country name to begin.";
        break;
      case "loading":
        status.textContent = `Searching for “${state.query}”…`;
        break;
      case "empty":
        status.textContent = `No countries found for “${state.query}”.`;
        break;
      case "results":
        status.textContent = `${state.countries.length} ${
          state.countries.length === 1 ? "country" : "countries"
        } found.`;
        results.replaceChildren(...state.countries.map(renderCountryCard));
        break;
      case "error":
        status.textContent =
          "Could not load countries. Check your connection and try again.";
        break;
    }
  }

  const searchAfterPause = debounce((query: string) => {
    const currentQuery = input.value.trim();
    if (!disposed && currentQuery && currentQuery === query.trim()) {
      void controller.search(currentQuery);
    }
  }, debounceDelayMs);

  const handleInput = () => {
    const query = input.value;
    selectedCountry = undefined;
    controller.inputChanged(query);
    if (query.trim()) {
      searchAfterPause(query);
    }
  };

  const handleRetry = () => {
    void controller.retry();
  };

  input.addEventListener("input", handleInput);
  retryButton.addEventListener("click", handleRetry);
  render(controller.getState());

  return () => {
    disposed = true;
    input.removeEventListener("input", handleInput);
    retryButton.removeEventListener("click", handleRetry);
    controller.dispose();
    root.replaceChildren();
  };
}

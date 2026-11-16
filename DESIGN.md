# Design

## Cancelling outdated requests

The view calls `inputChanged` immediately for every input event, before
scheduling the debounced search. The controller increments its request ID,
aborts the active `AbortController`, and clears the displayed results. This
prevents an older request from completing during the debounce delay.

When a search starts, the controller passes `fetch` a signal composed from the
request's abort signal and a 15-second timeout signal using
`AbortSignal.any`. An `AbortError` caused by a newer input is ignored;
`TimeoutError`, HTTP errors, and network failures are shown as errors. The
request ID check prevents a stale completion from publishing state, but it is a
final safeguard in addition to actually aborting the request, not a replacement
for cancellation.

## Debounce delay

The view uses a trailing debounce of 350 ms. This gives a user time to continue
typing before sending another request. Without the delay, each keystroke would
start a search. A much longer delay would reduce requests further but make
results feel slow to appear.

## Complexity

`mapCountryResponse` processes the language, currency, and border arrays once.
Its time complexity is O(n), where n is the total number of entries in those
arrays. It creates mapped language and border arrays and a currency string, so
its additional space complexity is also O(n).

The optional response cache and in-flight request deduplication are not
implemented.

## Clean-code practices

- Responsibilities are separated: `searchCountries` handles HTTP,
  `countrySearchController` manages request state and cancellation,
  `mapCountryResponse` maps API data, and `debounce` handles timing. The core
  modules do not depend on the DOM.
- `mapCountryResponse` is a pure transformation: it receives response data and
  returns card data without network or DOM side effects.
- `countrySearchView` owns DOM rendering and calls the controller for behavior.
  Dynamic content is created with DOM APIs and assigned through `textContent`,
  rather than inserted as HTML.
- TypeScript types such as `CountryCardData` and `CountrySearchState` make the
  boundaries between mapping, controller, and view explicit.

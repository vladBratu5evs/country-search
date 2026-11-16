export type SearchErrorKind = "abort" | "timeout" | "http" | "unknown";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    statusText: string,
  ) {
    super(
      `Country search failed: ${status}${statusText ? ` ${statusText}` : ""}`,
    );
    this.name = "HttpError";
  }
}

export function classifySearchError(error: unknown): SearchErrorKind {
  if (
    typeof error !== "object" ||
    error === null ||
    !("name" in error) ||
    typeof error.name !== "string"
  ) {
    return "unknown";
  }

  switch (error.name) {
    case "AbortError":
      return "abort";
    case "TimeoutError":
      return "timeout";
    case "HttpError":
      return "http";
    default:
      return "unknown";
  }
}

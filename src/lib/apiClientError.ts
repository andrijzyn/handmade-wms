export type ApiClientError = Error & {
  status?: number;
};

export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }

  if (error instanceof Error) {
    const match = error.message.match(/\b\d{3}\b/);
    if (match) return Number(match[0]);
  }

  return undefined;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (!(error instanceof Error)) return fallback;

  const raw = error.message.trim();
  if (!raw) return fallback;

  const colonIndex = raw.indexOf(":");
  const body = colonIndex >= 0 ? raw.slice(colonIndex + 1).trim() : raw;

  if (body.startsWith("{") && body.endsWith("}")) {
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      return body;
    }
  }

  return body || fallback;
}

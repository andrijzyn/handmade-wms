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
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      return body || fallback;
    }
  }

  return body || fallback;
}

export async function createApiClientErrorFromResponse(
  res: Response,
  fallbackMessage: string,
): Promise<ApiClientError> {
  let message = fallbackMessage;
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = (await res.json().catch(() => null)) as
      | { message?: unknown }
      | null;

    if (data && typeof data.message === "string" && data.message.trim()) {
      message = data.message;
    }
  } else {
    const text = await res.text().catch(() => "");
    if (text.trim()) {
      message = text.trim();
    }
  }

  const error: ApiClientError = new Error(message);
  error.status = res.status;
  return error;
}

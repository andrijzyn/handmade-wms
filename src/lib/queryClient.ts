"use client";

import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (res.ok) return;

  let message = res.statusText || "Request failed";

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => null);

    if (data && typeof data === "object") {
      if ("message" in data && typeof data.message === "string") {
        message = data.message;
      } else if ("error" in data && typeof data.error === "string") {
        message = data.error;
      }
    }
  } else {
    const text = await res.text().catch(() => "");
    if (text) {
      message = text;
    }
  }

  const error = new Error(message) as Error & {
    status?: number;
    response?: Response;
  };

  error.status = res.status;
  error.response = res;

  throw error;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/"));

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 1000 * 60,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

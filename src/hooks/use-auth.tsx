"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import type { SafeUser } from "@/lib/storage";
import type { LoginInput } from "@/lib/schema";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: user,
    isLoading,
  } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return await res.json();
    },
    onSuccess: (userData: SafeUser) => {
      queryClient.setQueryData(["/api/auth/me"], userData);
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Помилка входу",
        description: error.message.includes("401")
            ? "Невірний логін або пароль"
            : error.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Помилка виходу",
        description: error.message,
      });
    },
  });

  const login = async (data: LoginInput) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch {
      // Помилка вже оброблена в onError, свідомо не пробрасываємо далі
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Аналогічно, помилка вже показана тостом
    }
  };

  return (
      <AuthContext.Provider
          value={{ user: user ?? null, isLoading, login, logout }}
      >
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
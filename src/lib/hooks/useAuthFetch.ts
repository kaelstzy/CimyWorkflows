"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  pagination?: { nextCursor: string | null };
}
export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
}
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/**
 * Returns a fetch function that automatically attaches
 * `Authorization: Bearer <idToken>` using the current signed-in user.
 * Every call to the /api/conversations* routes should go through this.
 */
export function useAuthFetch() {
  const { user } = useAuth();

  return useCallback(
    async <T = unknown>(input: string, init?: RequestInit): Promise<ApiResponse<T>> => {
      if (!user) {
        return {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Not signed in." },
        };
      }

      const idToken = await user.getIdToken();
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${idToken}`);
      if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(input, { ...init, headers });
      return (await res.json()) as ApiResponse<T>;
    },
    [user]
  );
}

import { NextResponse } from "next/server";

export function apiSuccess<T>(
  data: T,
  init?: { status?: number; pagination?: { nextCursor: string | null } }
) {
  const body: { success: true; data: T; pagination?: { nextCursor: string | null } } = {
    success: true,
    data,
  };
  if (init?.pagination) {
    body.pagination = init.pagination;
  }
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

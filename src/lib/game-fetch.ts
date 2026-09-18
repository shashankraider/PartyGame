"use client";
/** Keep controls recoverable when the network fails. Interview retries retain their request ID. */
export async function gameFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try { return await fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(110_000) }); }
  catch { return Response.json({ error: "Connection interrupted. Please try again." }, { status: 503 }); }
}
export function newRequestId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

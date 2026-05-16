import { randomInt } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createJoinCode(length = 5): string {
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export function normalizeJoinCode(value: string): string {
  return value.trim().toUpperCase().replaceAll(/[^A-Z0-9]/g, "");
}

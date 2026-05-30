import test from "node:test";
import assert from "node:assert/strict";
import { jwtVerify } from "jose";

import {
  hasRealtimeAuthEnv,
  mintSessionRealtimeToken,
  RealtimeAuthError,
} from "../src/lib/realtime-auth.ts";

const TEST_SECRET = "test-jwt-secret-at-least-32-bytes-long-xyz";

test("hasRealtimeAuthEnv reflects SUPABASE_JWT_SECRET presence", () => {
  const prior = process.env.SUPABASE_JWT_SECRET;
  delete process.env.SUPABASE_JWT_SECRET;
  assert.equal(hasRealtimeAuthEnv(), false);
  process.env.SUPABASE_JWT_SECRET = TEST_SECRET;
  assert.equal(hasRealtimeAuthEnv(), true);
  if (prior === undefined) delete process.env.SUPABASE_JWT_SECRET;
  else process.env.SUPABASE_JWT_SECRET = prior;
});

test("mintSessionRealtimeToken throws missing_secret when env unset", async () => {
  const prior = process.env.SUPABASE_JWT_SECRET;
  delete process.env.SUPABASE_JWT_SECRET;
  await assert.rejects(
    () => mintSessionRealtimeToken("00000000-0000-0000-0000-000000000001"),
    (err) => err instanceof RealtimeAuthError && err.code === "missing_secret",
  );
  if (prior !== undefined) process.env.SUPABASE_JWT_SECRET = prior;
});

test("mintSessionRealtimeToken produces a verifiable HS256 JWT with the right claims", async () => {
  const prior = process.env.SUPABASE_JWT_SECRET;
  process.env.SUPABASE_JWT_SECRET = TEST_SECRET;

  const sessionId = "11111111-2222-3333-4444-555555555555";
  const result = await mintSessionRealtimeToken(sessionId, {
    ttlSeconds: 300,
    deviceId: "device-abc",
  });

  assert.ok(result.token.split(".").length === 3, "token is a JWS with 3 segments");
  assert.ok(result.expiresAt > Math.floor(Date.now() / 1000));

  const { payload } = await jwtVerify(
    result.token,
    new TextEncoder().encode(TEST_SECRET),
    { issuer: "mystery-engine", audience: "authenticated" },
  );

  assert.equal(payload.session_id, sessionId);
  assert.equal(payload.role, "authenticated");
  assert.equal(payload.sub, `${sessionId}:device-abc`);
  assert.equal(payload.iss, "mystery-engine");
  assert.equal(payload.aud, "authenticated");
  assert.equal(typeof payload.exp, "number");

  if (prior === undefined) delete process.env.SUPABASE_JWT_SECRET;
  else process.env.SUPABASE_JWT_SECRET = prior;
});

test("mintSessionRealtimeToken clamps very short TTLs up to 60s", async () => {
  const prior = process.env.SUPABASE_JWT_SECRET;
  process.env.SUPABASE_JWT_SECRET = TEST_SECRET;

  const before = Math.floor(Date.now() / 1000);
  const result = await mintSessionRealtimeToken("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", {
    ttlSeconds: 5,
  });

  assert.ok(result.expiresAt - before >= 60, "TTL clamped to >=60s");

  if (prior === undefined) delete process.env.SUPABASE_JWT_SECRET;
  else process.env.SUPABASE_JWT_SECRET = prior;
});

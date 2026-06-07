import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  clearActivePlayerSession,
  getPlayerSessionPath,
  readActivePlayerSession,
  writeActivePlayerSession,
} from "../src/lib/player-session.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("active player session", () => {
  test("round-trips a saved detective session by normalized join code", () => {
    const storage = memoryStorage();
    writeActivePlayerSession(storage, {
      joinCode: "6bzhy",
      playerName: "Naina",
      sessionId: "session-1",
      playerId: "player-1",
    });

    assert.deepEqual(readActivePlayerSession(storage, "6BZHY"), {
      version: 1,
      joinCode: "6BZHY",
      playerName: "Naina",
      sessionId: "session-1",
      playerId: "player-1",
    });
  });

  test("clears a saved session and builds its player route", () => {
    const storage = memoryStorage();
    writeActivePlayerSession(storage, {
      joinCode: "6BZHY",
      playerName: "Naina",
      sessionId: "session-1",
      playerId: "player-1",
    });

    assert.equal(
      getPlayerSessionPath({ sessionId: "session-1", playerId: "player-1" }),
      "/session/session-1/player/player-1",
    );
    clearActivePlayerSession(storage, "6BZHY");
    assert.equal(readActivePlayerSession(storage, "6BZHY"), null);
  });

  test("ignores malformed or obsolete saved data", () => {
    const storage = memoryStorage();
    storage.setItem(
      "mystery-engine-active-player:6BZHY",
      JSON.stringify({ version: 0, joinCode: "6BZHY" }),
    );
    assert.equal(readActivePlayerSession(storage, "6BZHY"), null);
  });
});

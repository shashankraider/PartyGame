const ACTIVE_PLAYER_KEY_PREFIX = "mystery-engine-active-player:";
const ACTIVE_PLAYER_VERSION = 1;

export type ActivePlayerSession = {
  version: typeof ACTIVE_PLAYER_VERSION;
  joinCode: string;
  playerName: string;
  sessionId: string;
  playerId: string;
};

function storageKey(joinCode: string) {
  return `${ACTIVE_PLAYER_KEY_PREFIX}${joinCode.trim().toUpperCase()}`;
}

export function readActivePlayerSession(
  storage: Pick<Storage, "getItem">,
  joinCode: string,
): ActivePlayerSession | null {
  try {
    const raw = storage.getItem(storageKey(joinCode));
    if (!raw) return null;

    const value = JSON.parse(raw) as Partial<ActivePlayerSession>;
    if (
      value.version !== ACTIVE_PLAYER_VERSION ||
      value.joinCode !== joinCode.trim().toUpperCase() ||
      typeof value.playerName !== "string" ||
      !value.playerName.trim() ||
      typeof value.sessionId !== "string" ||
      !value.sessionId ||
      typeof value.playerId !== "string" ||
      !value.playerId
    ) {
      return null;
    }

    return value as ActivePlayerSession;
  } catch {
    return null;
  }
}

export function writeActivePlayerSession(
  storage: Pick<Storage, "setItem">,
  session: Omit<ActivePlayerSession, "version" | "joinCode"> & { joinCode: string },
) {
  const value: ActivePlayerSession = {
    version: ACTIVE_PLAYER_VERSION,
    ...session,
    joinCode: session.joinCode.trim().toUpperCase(),
  };
  try {
    storage.setItem(storageKey(value.joinCode), JSON.stringify(value));
  } catch {
    // Storage can be blocked in private browsing. Joining must still succeed.
  }
}

export function clearActivePlayerSession(
  storage: Pick<Storage, "removeItem">,
  joinCode: string,
) {
  try {
    storage.removeItem(storageKey(joinCode));
  } catch {
    // A blocked storage API should not prevent the join form from recovering.
  }
}

export function getPlayerSessionPath(session: Pick<ActivePlayerSession, "sessionId" | "playerId">) {
  return `/session/${session.sessionId}/player/${session.playerId}`;
}

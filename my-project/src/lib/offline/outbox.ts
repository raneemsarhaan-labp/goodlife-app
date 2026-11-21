/**
 * Offline outbox for check-offs (research.md §4). Mutations that cannot reach the server are
 * stored in IndexedDB with the tap time (`recordedAt`) and replayed in order when the device is
 * back online. Each carries a clientMutationId, so replays are idempotent on the server.
 */
import { openDB, type IDBPDatabase } from "idb";
import type { ErrorCode, Result } from "@/server/actions/result";

export type Mutation = {
  clientMutationId: string;
  kind: "habit" | "challenge";
  payload: Record<string, unknown>;
  recordedAt: string; // ISO time of the tap
  createdAt: number;
};

export type Sender = (m: Mutation, opts: { replay: boolean }) => Promise<Result<unknown>>;
export type SendOutcome = "saved" | "queued" | { error: ErrorCode };

const DB_NAME = "goodlife-outbox";
const STORE = "mutations";
let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: "clientMutationId" });
    },
  });
  return dbPromise;
}

export async function enqueue(m: Mutation) {
  await (await db()).put(STORE, m);
}

export async function pending(): Promise<Mutation[]> {
  const all = (await (await db()).getAll(STORE)) as Mutation[];
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

async function remove(id: string) {
  await (await db()).delete(STORE, id);
}

/** Sends now if possible; otherwise queues. Network failures queue, server refusals do not. */
export async function send(m: Mutation, sender: Sender): Promise<SendOutcome> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueue(m);
    return "queued";
  }
  try {
    const result = await sender(m, { replay: false });
    return result.ok ? "saved" : { error: result.error };
  } catch {
    await enqueue(m);
    return "queued";
  }
}

/**
 * Replays queued mutations oldest first. Stops at the first network failure (still offline).
 * Entries the server refuses (e.g. older than 7 days → date_not_editable) are dropped and
 * reported through `onDropped`. Returns how many were saved.
 */
export async function replay(sender: Sender, onDropped: (m: Mutation) => void): Promise<number> {
  let saved = 0;
  for (const m of await pending()) {
    try {
      const result = await sender(m, { replay: true });
      await remove(m.clientMutationId);
      if (result.ok) saved += 1;
      else onDropped(m);
    } catch {
      break;
    }
  }
  return saved;
}

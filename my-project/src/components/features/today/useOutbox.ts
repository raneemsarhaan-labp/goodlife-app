"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { pending, replay, send, type Mutation, type Sender, type SendOutcome } from "@/lib/offline/outbox";
import { saveReflection } from "@/server/actions/reflections";
import { setChallengeDone, setHabitDone } from "@/server/actions/today";

/** Online: today/yesterday rule. Replay: sends the tap time so the 7-day rule applies. */
const sender: Sender = (m, { replay: isReplay }) => {
  const recordedAt = isReplay ? m.recordedAt : undefined;
  if (m.kind === "reflection") return saveReflection({ ...m.payload, clientMutationId: m.clientMutationId });
  const input = { ...m.payload, clientMutationId: m.clientMutationId, recordedAt };
  return m.kind === "habit" ? setHabitDone(input) : setChallengeDone(input);
};

/** Submits check-offs through the offline outbox and replays the queue when back online. */
export function useOutbox({ onDropped }: { onDropped?: () => void } = {}) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const replaying = useRef(false);
  const onDroppedRef = useRef(onDropped);
  useEffect(() => {
    onDroppedRef.current = onDropped;
  });

  const refreshPending = useCallback(async () => {
    const items = await pending().catch(() => []);
    setPendingIds(new Set(items.map((m) => String(m.payload.habitId ?? m.payload.kind ?? m.kind))));
  }, []);

  const flush = useCallback(async () => {
    if (replaying.current || !navigator.onLine) return;
    replaying.current = true;
    try {
      const saved = await replay(sender, () => onDroppedRef.current?.());
      await refreshPending();
      if (saved > 0) router.refresh();
    } finally {
      replaying.current = false;
    }
  }, [refreshPending, router]);

  useEffect(() => {
    const start = window.setTimeout(() => void refreshPending().then(flush), 0);
    window.addEventListener("online", flush);
    return () => {
      window.clearTimeout(start);
      window.removeEventListener("online", flush);
    };
  }, [flush, refreshPending]);

  const submit = useCallback(
    async (m: Omit<Mutation, "createdAt" | "recordedAt" | "clientMutationId">): Promise<SendOutcome> => {
      const outcome = await send(
        { ...m, clientMutationId: crypto.randomUUID(), recordedAt: new Date().toISOString(), createdAt: Date.now() },
        sender,
      );
      if (outcome === "queued") await refreshPending();
      return outcome;
    },
    [refreshPending],
  );

  return { submit, pendingIds };
}

"use client";

import { useCallback, useEffect } from "react";
import { getUser, isAuthenticated, updateUser } from "@/lib/auth";
import { HEARTBEAT_INTERVAL_MS, UserStatus } from "@/lib/presence";
import {
    useSendHeartbeatMutation,
    useUpdateStatusMutation
} from "./api/presence.api";

/**
 * Keeps the signed-in user marked live and exposes the status picker's action.
 *
 * The beat pauses while the tab is hidden, so closing or backgrounding the app
 * lets the server's timeout drop the user to offline on its own — that is what
 * makes "online" mean online rather than "logged in once".
 */
export function usePresence() {
    const [sendHeartbeat] = useSendHeartbeatMutation();
    const [updateStatus, { isLoading: isSaving }] = useUpdateStatusMutation();

    useEffect(() => {
        if (!isAuthenticated()) return;

        const beat = () => {
            if (document.visibilityState === "hidden") return;
            sendHeartbeat();
        };

        beat();

        const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

        // Coming back to the tab should restore presence immediately rather
        // than leaving the user offline until the next tick.
        document.addEventListener("visibilitychange", beat);

        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", beat);
        };
    }, [sendHeartbeat]);

    const setStatus = useCallback(
        async (status: UserStatus) => {
            // Cached first so every mounted avatar repaints without waiting on
            // the round-trip; a failure rolls the cache back to the old pick.
            const previous = getUser()?.status;
            updateUser({ status });

            try {
                await updateStatus(status).unwrap();
            } catch {
                updateUser({ status: previous });
            }
        },
        [updateStatus]
    );

    return { setStatus, isSaving };
}

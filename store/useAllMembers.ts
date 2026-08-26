"use client";

import { useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "./hooks";
import type { RootState } from "./index";
import { membersApi } from "./api/members.api";
import type { Member } from "./types";

/**
 * The members page spans every workspace at once, so it needs N getMembers cache
 * entries — more than the rules of hooks let us subscribe to individually. Same
 * shape as useModuleData: this selector reads the RTK Query cache directly and
 * the effect below drives the fetches, so the data still goes through the shared
 * cache (dedupe, tag invalidation, keepUnusedDataFor) with no per-workspace hook.
 */

export interface MembershipRow {
    /** `${workspaceId}:${userId}` — stable across refetches. */
    id: string;
    workspaceId: string;
    member: Member;
}

type CacheEntry = {
    endpointName?: string;
    originalArgs?: unknown;
    data?: unknown;
};

const selectQueries = (state: RootState) =>
    state.api.queries as Record<string, CacheEntry | undefined>;

export const memberUserId = (member: Member) =>
    String(member.user?._id ?? member._id);

const selectMembershipsFor = createSelector(
    [selectQueries, (_state: RootState, workspaceIds: string[]) => workspaceIds],
    (queries, workspaceIds) => {
        const wanted = new Set(workspaceIds);
        const rows: MembershipRow[] = [];
        let loadedCount = 0;

        for (const key of Object.keys(queries)) {
            const entry = queries[key];

            if (
                entry?.endpointName === "getMembers" &&
                typeof entry.originalArgs === "string" &&
                wanted.has(entry.originalArgs) &&
                Array.isArray(entry.data)
            ) {
                const workspaceId = entry.originalArgs;
                loadedCount += 1;

                (entry.data as Member[]).forEach((member) => {
                    rows.push({
                        id: `${workspaceId}:${memberUserId(member)}`,
                        workspaceId,
                        member,
                    });
                });
            }
        }

        return { rows, loadedCount };
    }
);

export function useAllMembers(workspaceIds: string[]) {
    const dispatch = useAppDispatch();

    const idsKey = workspaceIds.join(",");

    useEffect(() => {
        if (!idsKey) return;

        const subscriptions = idsKey
            .split(",")
            .filter(Boolean)
            .map((workspaceId) =>
                dispatch(membersApi.endpoints.getMembers.initiate(workspaceId))
            );

        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    }, [idsKey, dispatch]);

    const stableIds = useMemo(() => idsKey.split(",").filter(Boolean), [idsKey]);

    const { rows, loadedCount } = useAppSelector(
        (state) => selectMembershipsFor(state, stableIds),
        shallowEqual
    );

    return {
        memberships: rows,
        isLoading: stableIds.length > 0 && loadedCount < stableIds.length,
    };
}

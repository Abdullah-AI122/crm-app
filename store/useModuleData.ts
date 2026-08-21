"use client";

import { useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "./hooks";
import { store, type RootState } from "./index";
import { recordsApi } from "./api/records.api";
import { recordValuesApi } from "./api/recordValues.api";
import type { RecordItem, RecordValue } from "./types";

/**
 * The board renders every collection in one flat pass, so it needs records from
 * N cache entries at once — more than the rules of hooks allow us to subscribe to
 * individually. These selectors read the RTK Query cache directly and the effects
 * below drive the fetches, so the data still goes through the shared cache
 * (dedupe, tag invalidation, keepUnusedDataFor) without per-collection hooks.
 */
type CacheEntry = {
    endpointName?: string;
    originalArgs?: unknown;
    data?: unknown;
};

const selectQueries = (state: RootState) =>
    state.api.queries as Record<string, CacheEntry | undefined>;

const selectRecordsFor = createSelector(
    [selectQueries, (_state: RootState, collectionIds: string[]) => collectionIds],
    (queries, collectionIds) => {
        const wanted = new Set(collectionIds);
        const out: RecordItem[] = [];
        for (const key of Object.keys(queries)) {
            const entry = queries[key];
            if (
                entry?.endpointName === "getRecords" &&
                typeof entry.originalArgs === "string" &&
                wanted.has(entry.originalArgs) &&
                Array.isArray(entry.data)
            ) {
                out.push(...(entry.data as RecordItem[]));
            }
        }
        return out;
    }
);

const selectRecordValuesFor = createSelector(
    [selectQueries, (_state: RootState, recordIds: string[]) => recordIds],
    (queries, recordIds) => {
        const wanted = new Set(recordIds);
        const out: RecordValue[] = [];
        for (const key of Object.keys(queries)) {
            const entry = queries[key];
            if (
                entry?.endpointName === "getRecordValues" &&
                typeof entry.originalArgs === "string" &&
                wanted.has(entry.originalArgs) &&
                Array.isArray(entry.data)
            ) {
                out.push(...(entry.data as RecordValue[]));
            }
        }
        return out;
    }
);

export function useModuleRecords(collectionIds: string[]) {
    const dispatch = useAppDispatch();

    const idsKey = collectionIds.join(",");

    // Fetch records for every collection on the board. `initiate` hits the same
    // cache as the hooks, so a repeat visit inside keepUnusedDataFor is free.
    useEffect(() => {
        if (!idsKey) return;
        const subscriptions = idsKey
            .split(",")
            .filter(Boolean)
            .map((collectionId) =>
                dispatch(recordsApi.endpoints.getRecords.initiate(collectionId))
            );
        return () => subscriptions.forEach((sub) => sub.unsubscribe());
    }, [idsKey, dispatch]);

    const stableIds = useMemo(
        () => idsKey.split(",").filter(Boolean),
        [idsKey]
    );

    const records = useAppSelector(
        (state) => selectRecordsFor(state, stableIds),
        shallowEqual
    );

    const recordIdsKey = records.map((r) => r._id).sort().join(",");

    useEffect(() => {
        if (!recordIdsKey) return;
        const subscriptions = recordIdsKey
            .split(",")
            .filter(Boolean)
            .map((recordId) =>
                dispatch(recordValuesApi.endpoints.getRecordValues.initiate(recordId))
            );
        return () => subscriptions.forEach((sub) => sub.unsubscribe());
    }, [recordIdsKey, dispatch]);

    const stableRecordIds = useMemo(
        () => recordIdsKey.split(",").filter(Boolean),
        [recordIdsKey]
    );

    const recordValues = useAppSelector(
        (state) => selectRecordValuesFor(state, stableRecordIds),
        shallowEqual
    );

    return { records, recordValues };
}

/** Imperative refetch for one collection, used after a record is created. */
export const refetchRecords = (collectionId: string) =>
    store.dispatch(
        recordsApi.endpoints.getRecords.initiate(collectionId, {
            subscribe: false,
            forceRefetch: true
        })
    );

/** Imperative refetch of one record's cells, used after a value is written. */
export const refetchRecordValues = (recordId: string) =>
    store.dispatch(
        recordValuesApi.endpoints.getRecordValues.initiate(recordId, {
            subscribe: false,
            forceRefetch: true
        })
    );

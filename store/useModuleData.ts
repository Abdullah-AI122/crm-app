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

/**
 * Built per hook instance rather than shared: one createSelector memoises on its
 * LAST arguments, so the board and every open sub-record table calling it with
 * different id lists would each throw away the previous one's cached result.
 */
const makeSelectRecordValuesFor = () => createSelector(
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

/**
 * The sub-records already loaded for a set of parents, READ ONLY.
 *
 * Deliberately does not fetch: each open SubRecordTable owns that subscription,
 * and this exists so the board can look a sub-record up by id — the amendments
 * panel is mounted at board level and has to resolve whichever row was clicked,
 * whether it came from the grid or from the block underneath it. Nothing is
 * subscribed here, so a collapsed row still costs nothing.
 */
const makeSelectSubRecordsFor = () => createSelector(
    [selectQueries, (_state: RootState, parentIds: string[]) => parentIds],
    (queries, parentIds) => {
        const wanted = new Set(parentIds);
        const out: RecordItem[] = [];
        for (const key of Object.keys(queries)) {
            const entry = queries[key];
            if (
                entry?.endpointName === "getSubRecords" &&
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

export function useSubRecordsFor(parentIds: string[]) {
    const idsKey = [...parentIds].sort().join(",");

    const stableParentIds = useMemo(
        () => idsKey.split(",").filter(Boolean),
        [idsKey]
    );

    const selectSubRecordsFor = useMemo(() => makeSelectSubRecordsFor(), []);

    return useAppSelector(
        (state) => selectSubRecordsFor(state, stableParentIds),
        shallowEqual
    );
}

/**
 * The cells for an arbitrary set of records, fetched and read through the same
 * shared cache. Used by the board for every row on it, and by each open
 * sub-record table for its own children.
 */
export function useRecordValuesFor(recordIds: string[]) {
    const dispatch = useAppDispatch();

    const idsKey = [...recordIds].sort().join(",");

    useEffect(() => {
        if (!idsKey) return;
        const subscriptions = idsKey
            .split(",")
            .filter(Boolean)
            .map((recordId) =>
                dispatch(recordValuesApi.endpoints.getRecordValues.initiate(recordId))
            );
        return () => subscriptions.forEach((sub) => sub.unsubscribe());
    }, [idsKey, dispatch]);

    const stableRecordIds = useMemo(
        () => idsKey.split(",").filter(Boolean),
        [idsKey]
    );

    const selectRecordValuesFor = useMemo(() => makeSelectRecordValuesFor(), []);

    return useAppSelector(
        (state) => selectRecordValuesFor(state, stableRecordIds),
        shallowEqual
    );
}

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

    const recordValues = useRecordValuesFor(records.map((r) => r._id));

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

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import type { Workspace } from "../types";

export const selectActiveWorkspaceId = (state: RootState) => state.ui.activeWorkspaceId;
export const selectSearch = (state: RootState) => state.ui.search;
export const selectView = (state: RootState) => state.ui.view;

/**
 * Client-side filtering over cached data — never triggers a request.
 * Memoized, so an unchanged list + query reuses the previous array reference.
 */
export const makeSelectFilteredWorkspaces = () =>
    createSelector(
        [(workspaces: Workspace[]) => workspaces, (_ws: Workspace[], query: string) => query],
        (workspaces, query) => {
            const q = query.trim().toLowerCase();
            if (!q) return workspaces;
            return workspaces.filter(
                (w) =>
                    w.name.toLowerCase().includes(q) ||
                    w._id.toLowerCase().includes(q)
            );
        }
    );

export const filterWorkspaces = (workspaces: Workspace[], query: string): Workspace[] => {
    const q = query.trim().toLowerCase();
    if (!q) return workspaces;
    return workspaces.filter(
        (w) => w.name.toLowerCase().includes(q) || w._id.toLowerCase().includes(q)
    );
};

export const paginate = <T,>(items: T[], page: number, perPage: number): T[] =>
    items.slice((page - 1) * perPage, (page - 1) * perPage + perPage);

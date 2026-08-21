import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const ACTIVE_WORKSPACE_KEY = "crm_active_workspace_id";

export interface UiState {
    activeWorkspaceId: string;
    search: string;
    view: "grid" | "list";
}

const initialState: UiState = {
    activeWorkspaceId: "",
    search: "",
    view: "grid"
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        // Called once on mount to rehydrate from localStorage (never during render).
        hydrateActiveWorkspace(state) {
            if (typeof window === "undefined") return;
            try {
                state.activeWorkspaceId =
                    localStorage.getItem(ACTIVE_WORKSPACE_KEY) ?? "";
            } catch {
                state.activeWorkspaceId = "";
            }
        },

        setActiveWorkspaceId(state, action: PayloadAction<string>) {
            state.activeWorkspaceId = action.payload;
            if (typeof window === "undefined" || !action.payload) return;
            try {
                localStorage.setItem(ACTIVE_WORKSPACE_KEY, action.payload);
            } catch {
                // storage unavailable (private mode) — in-memory state still works
            }
        },

        setSearch(state, action: PayloadAction<string>) {
            state.search = action.payload;
        },

        setView(state, action: PayloadAction<UiState["view"]>) {
            state.view = action.payload;
        }
    }
});

export const {
    hydrateActiveWorkspace,
    setActiveWorkspaceId,
    setSearch,
    setView
} = uiSlice.actions;

export default uiSlice.reducer;

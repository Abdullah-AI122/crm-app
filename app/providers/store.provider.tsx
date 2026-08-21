"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import { hydrateActiveWorkspace } from "@/store/slices/ui.slice";

function ActiveWorkspaceHydrator() {
    useEffect(() => {
        store.dispatch(hydrateActiveWorkspace());
    }, []);

    return null;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <ActiveWorkspaceHydrator />
            {children}
        </Provider>
    );
}

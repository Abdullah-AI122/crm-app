"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Provider } from "react-redux";
import { store } from "@/store";
import { hydrateActiveWorkspace, setActiveWorkspaceId } from "@/store/slices/ui.slice";

/**
 * Keeps `ui.activeWorkspaceId` in step with the URL.
 *
 * Before this, the id was only written when someone clicked a workspace in the
 * Sidebar — so opening /workspace/<id> directly, following a link, or landing on
 * a page with no Sidebar (the activity page) left the store pointing at whatever
 * was last in localStorage. Anything reading the store then queried the wrong
 * workspace and rendered empty.
 *
 * The route is the authority: if the path names a workspace, that is the active
 * one. Runs at provider level so it covers every route, Sidebar or not.
 */
function ActiveWorkspaceSync() {
    const pathname = usePathname();

    useEffect(() => {
        store.dispatch(hydrateActiveWorkspace());
    }, []);

    useEffect(() => {
        const match = /^\/workspace\/([^/?#]+)/.exec(pathname ?? "");
        const routeId = match?.[1];
        if (!routeId) return;

        if (store.getState().ui.activeWorkspaceId !== routeId) {
            store.dispatch(setActiveWorkspaceId(routeId));
        }
    }, [pathname]);

    return null;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <ActiveWorkspaceSync />
            {children}
        </Provider>
    );
}

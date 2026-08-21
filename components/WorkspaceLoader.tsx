"use client";

import CollectionLoader from "./CollectionLoader";

/**
 * Full-page skeleton for the dashboard shell: sidebar, header row and the
 * workspace card. Mirrors the real layout so nothing shifts once data lands.
 */
export default function WorkspaceLoader() {
    return (
        <section
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="w-full flex h-full font-google-sans"
        >
            <span className="sr-only">Loading your workspaces…</span>

            {/* Sidebar */}
            <aside className="w-82 h-screen bg-card flex flex-col flex-shrink-0 px-5 pt-5">
                <div className="flex items-center gap-4">
                    <div className="h-15 w-15 rounded-xl bg-gray-200/80 animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 rounded-full bg-gray-200/80 animate-pulse" />
                        <div className="h-3 w-1/3 rounded-full bg-gray-200/60 animate-pulse" />
                    </div>
                </div>

                <div className="mt-8 h-10 rounded-xl bg-gray-200/70 animate-pulse" />

                <div className="mt-6 space-y-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={`nav-${i}`}
                            className="h-9 rounded-lg bg-gray-200/60 animate-pulse"
                            style={{
                                width: `${70 + ((i * 11) % 30)}%`,
                                animationDelay: `${i * 80}ms`
                            }}
                        />
                    ))}
                </div>
            </aside>

            {/* Main column */}
            <div className="h-screen bg-canvas w-full">
                <div className="w-full flex flex-col gap-3 mx-auto pl-3 py-1 h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center pr-2">
                        <div className="h-11 w-full max-w-xl rounded-xl border border-gray-200 bg-card" />

                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-card/70 animate-pulse" />
                            <div className="h-10 w-10 rounded-full bg-card/70 animate-pulse" />
                        </div>
                    </div>

                    {/* Workspace card */}
                    <div className="bg-panel rounded-l-2xl overflow-hidden h-full flex flex-col shadow-sm">
                        <div className="bg-accent pt-2.5 px-6 flex items-end min-h-[52px] gap-2">
                            <div className="h-9 w-36 rounded-t-[18px] bg-panel" />
                            <div className="h-4 w-28 mb-3 rounded-full bg-card/40 animate-pulse" />
                            <div className="h-4 w-24 mb-3 rounded-full bg-card/40 animate-pulse" />
                        </div>

                        <div className="flex-1 overflow-hidden px-4 pt-2 pb-2">
                            <CollectionLoader rows={10} columns={6} />
                        </div>

                        <div className="px-8 py-5 flex items-center justify-between">
                            <div className="h-4 w-40 rounded-full bg-gray-300/50 animate-pulse" />
                            <div className="flex items-center gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={`page-${i}`}
                                        className="w-10 h-10 rounded-2xl bg-control animate-pulse"
                                        style={{ animationDelay: `${i * 90}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

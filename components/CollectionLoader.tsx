"use client";

type CollectionLoaderProps = {
    rows?: number;
    columns?: number;
    /** Show the header placeholder row above the skeleton rows. */
    withHeader?: boolean;
};

export default function CollectionLoader({
    rows = 6,
    columns = 6,
    withHeader = true
}: CollectionLoaderProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className="w-full px-2 pt-1 font-google-sans"
        >
            <span className="sr-only">Loading collection…</span>

            {withHeader && (
                <div
                    className="grid gap-4 border-b border-gray-200/40 px-4 py-3"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: columns }).map((_, i) => (
                        <div
                            key={`head-${i}`}
                            className="h-3 rounded-full bg-gray-300/70 animate-pulse"
                            style={{ width: `${55 + ((i * 13) % 35)}%` }}
                        />
                    ))}
                </div>
            )}

            <div className="divide-y divide-gray-200/30">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="grid gap-4 px-4 py-4"
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                            animationDelay: `${rowIndex * 70}ms`
                        }}
                    >
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="h-4 rounded-lg bg-gray-200/70 animate-pulse"
                                style={{
                                    width: `${60 + ((rowIndex * 7 + colIndex * 17) % 40)}%`,
                                    animationDelay: `${(rowIndex * 70) + (colIndex * 40)}ms`
                                }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

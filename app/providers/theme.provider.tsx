"use client";

import { ThemeProvider } from "next-themes";
import { themes } from "@/data/data";

/** Theme values that map to a class in globals.css. "system" is handled by next-themes. */
const THEME_CLASSES = themes
    .map((item: { value: string }) => item.value)
    .filter((value: string) => value !== "system");

export default function ThemeProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            themes={THEME_CLASSES}
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}

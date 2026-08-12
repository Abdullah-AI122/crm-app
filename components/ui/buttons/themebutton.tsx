"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { themes } from "@/data/data";

export default function ThemeButton() {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);


    const selectedTheme = themes.find((item) => item.value === theme);

    return (
        <div className="w-full">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between rounded-lg px-5 py-2 hover:bg-gray-50 transition cursor-pointer"
            >
                <span>Theme</span>

                <div className="flex items-center gap-2">
                    <span
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{
                            backgroundColor: selectedTheme?.bg_hex,
                        }}
                    />
                </div>
            </button>

            <div
                className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="px-5 pb-1 space-y-0.5 ">
                        {themes.map((item) => (
                            <button
                                key={item.value}
                                onClick={() => {
                                    setTheme(item.value);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition cursor-pointer ${theme === item.value
                                    ? "bg-gray-100 font-medium"
                                    : "hover:bg-gray-50"
                                    }`}
                            >
                                <span>{item.name}</span>

                                <span
                                    className="w-5 h-5 rounded-full border border-gray-300"
                                    style={{
                                        backgroundColor: item.bg_hex,
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
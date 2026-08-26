"use client";

import { useRef } from "react";

import { useSearchHotkey } from "@/lib/useSearchHotkey";
import { IoIosSearch } from "react-icons/io";

interface SearchBarProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}

export default function SearchBar({
    value = "",
    onChange,
    placeholder = "Search anything...",
}: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Shared, so every search box in the app answers the same key.
    useSearchHotkey(inputRef);

    return (
        <div className="flex w-full max-w-xl items-center">
            <div className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-card px-3">
                <IoIosSearch
                    size={18}
                    className="text-gray-400"
                />

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    className="ml-2 flex-1 bg-transparent px-1 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />

                <div className="hidden items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 sm:flex">
                    <span className="text-[10px] text-gray-400">
                        Ctrl
                    </span>

                    <span className="text-[10px] text-gray-300">
                        +
                    </span>

                    <span className="text-[10px] text-gray-400">
                        K
                    </span>
                </div>
            </div>
        </div>
    );
}
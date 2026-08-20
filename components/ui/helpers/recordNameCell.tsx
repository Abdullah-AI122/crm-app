"use client";

import { useEffect, useRef, useState } from "react";
import { CgMenuGridO } from "react-icons/cg";

interface RecordNameCellProps {
    record: {
        name: string;
        [key: string]: any;
    };
    color: string;
    width: number;
    selected: boolean;
    onSave: (record: any, value: string) => void;
}

export default function RecordNameCell({
    record,
    color,
    width,
    selected,
    onSave,
}: RecordNameCellProps) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(record.name);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setValue(record.name);
    }, [record.name]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const commit = () => {
        setEditing(false);

        const trimmed = value.trim();

        if (trimmed && trimmed !== record.name) {
            onSave(record, trimmed);
        } else {
            setValue(record.name);
        }
    };

    return (
        <div
            className={`sticky left-10 z-10 flex shrink-0 items-center gap-2 border-r border-slate-300 px-3 py-2.5 text-sm font-google-sans ${
                selected ? "bg-gray-100" : "bg-white"
            }`}
            style={{
                width,
                borderLeft: `3px solid ${color}`,
            }}
        >
            <span className="shrink-0 cursor-grab text-xs active:cursor-grabbing">
                <CgMenuGridO />
            </span>

            {editing ? (
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            commit();
                        }

                        if (e.key === "Escape") {
                            setValue(record.name);
                            setEditing(false);
                        }
                    }}
                    className="w-full border-none bg-transparent text-sm text-slate-800 outline-none ring-0"
                />
            ) : (
                <span
                    onClick={() => setEditing(true)}
                    className="w-full cursor-text truncate text-slate-800"
                >
                    {record.name}
                </span>
            )}
        </div>
    );
}
"use client";

import { HiOutlineXMark } from "react-icons/hi2";

interface CreateModuleProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    moduleName: string;
    setModuleName: (value: string) => void;
    moduleDescription: string;
    setModuleDescription: (value: string) => void;
    creatingModule: boolean;
    createModule: () => void;
}

export default function CreateModule({
    open,
    setOpen,
    moduleName,
    setModuleName,
    moduleDescription,
    setModuleDescription,
    creatingModule,
    createModule,
}: CreateModuleProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-5 z-50 backdrop-blur-sm">
            <div
                className="rounded-xl px-6 py-8 w-full max-w-md shadow-2xl border border-slate-700"
                style={{ background: "#111727" }}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-white font-dmsans">
                        Create Module
                    </h2>

                    <button
                        onClick={() => setOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 cursor-pointer transition"
                        aria-label="Close"
                    >
                        <HiOutlineXMark className="w-5 h-5" />
                    </button>
                </div>

                <label className="text-xs text-slate-400 mb-1.5 block font-dmsans">
                    Module name
                </label>

                <input
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createModule()}
                    placeholder="e.g. Product Launch"
                    autoFocus
                    className="w-full border border-slate-700 rounded-xl px-4 py-2.5 mb-4 text-sm text-white outline-none focus:border-[#415A77] transition font-dmsans"
                    style={{ background: "#0D1B2A" }}
                />

                <label className="text-xs text-slate-400 mb-1.5 block font-dmsans">
                    Description
                </label>

                <textarea
                    value={moduleDescription}
                    onChange={(e) => setModuleDescription(e.target.value)}
                    placeholder="What's this module for?"
                    className="w-full border border-slate-700 rounded-xl px-4 py-2.5 mb-6 h-28 text-sm text-white outline-none focus:border-[#415A77] transition resize-none font-dmsans"
                    style={{ background: "#0D1B2A" }}
                />

                <div className="flex gap-3">
                    <button
                        onClick={createModule}
                        disabled={creatingModule}
                        className="flex-1 bg-white text-slate-800 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-100 disabled:opacity-60 transition cursor-pointer font-dmsans"
                    >
                        {creatingModule ? "Creating..." : "Create Module"}
                    </button>

                    <button
                        onClick={() => setOpen(false)}
                        className="flex-1 bg-slate-700 text-white py-2.5 rounded-xl text-sm font-medium transition cursor-pointer font-dmsans"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
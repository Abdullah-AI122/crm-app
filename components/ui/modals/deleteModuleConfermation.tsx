"use client";

import { HiOutlineTrash } from "react-icons/hi2";

interface Module {
    _id: string;
    name: string;
}

interface DeleteModuleModalProps {
    deleteModuleModal: string | null;
    modules: Module[];
    deleteModule: (moduleId: string) => void | Promise<void>;
    deletingModuleId: string | null;
    setDeleteModuleModal: (value: string | null) => void;
}

export default function DeleteModuleModal({
    deleteModuleModal,
    modules,
    deleteModule,
    deletingModuleId,
    setDeleteModuleModal,
}: DeleteModuleModalProps) {
    if (!deleteModuleModal) return null;

    const moduleName =
        modules.find((moduleItem) => moduleItem._id === deleteModuleModal)?.name ||
        "this module";

    const isDeleting = deletingModuleId === deleteModuleModal;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-5 z-50 backdrop-blur-sm">
            <div
                className="rounded-xl px-6 py-8 w-full max-w-sm shadow-2xl border border-slate-700"
                style={{ background: "#111727" }}
            >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 mb-4 mx-auto">
                    <HiOutlineTrash className="w-6 h-6 text-red-400" />
                </div>

                <h2 className="text-lg font-semibold text-white text-center mb-1 font-dmsans">
                    Delete Module
                </h2>

                <p className="text-sm text-slate-400 text-center mb-6 font-dmsans">
                    This will permanently delete{" "}
                    <span className="text-white font-medium">
                        {moduleName}
                    </span>{" "}
                    and all its data. This action cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => deleteModule(deleteModuleModal)}
                        disabled={isDeleting}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 transition cursor-pointer font-dmsans"
                    >
                        {isDeleting ? "Deleting..." : "Delete Module"}
                    </button>

                    <button
                        onClick={() => setDeleteModuleModal(null)}
                        disabled={!!deletingModuleId}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-medium transition cursor-pointer font-dmsans disabled:opacity-60"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
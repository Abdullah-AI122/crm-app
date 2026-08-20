"use client";

import { HiOutlineXMark } from "react-icons/hi2";

interface DeleteCollectionModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    collectionId: string;
    deletingCollectionId: string | null;
    deleteCollection: (collectionId: string) => void;
}

export default function DeleteCollectionModal({
    open,
    setOpen,
    collectionId,
    deletingCollectionId,
    deleteCollection,
}: DeleteCollectionModalProps) {
    if (!open) return null;

    const deleting = deletingCollectionId === collectionId;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="font-dmsans text-lg font-semibold text-slate-900">
                            Delete Collection
                        </h2>

                        <p className="mt-1 font-dmsans text-xs text-slate-500">
                            Permanently remove this collection
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={deleting}
                        className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <HiOutlineXMark
                            size={18}
                            strokeWidth={2.5}
                        />
                    </button>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50 p-3.5">
                    <p className="font-dmsans text-sm leading-5 text-red-700">
                        Are you sure you want to delete this
                        collection?
                    </p>

                    <p className="mt-2 font-dmsans text-xs leading-5 text-red-600">
                        This action cannot be undone. All records
                        inside this collection will also be deleted.
                    </p>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        disabled={deleting}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 font-dmsans text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={() => deleteCollection(collectionId)}
                        disabled={deleting}
                        className="flex-1 cursor-pointer rounded-xl bg-[#FB923C] py-2.5 font-dmsans text-sm font-medium text-white transition hover:bg-[#F97316] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {deleting
                            ? "Deleting..."
                            : "Delete Collection"}
                    </button>
                </div>
            </div>
        </div>
    );
}
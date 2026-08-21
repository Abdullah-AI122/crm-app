import {
    HiOutlineClipboardDocument,
    HiOutlinePencilSquare,
    HiOutlineTrash,
} from "react-icons/hi2";
import type { Workspace } from "@/store/types";

interface WorkspaceMenuProps {
    workspace: Workspace;
    copyingId: string | null;
    setCopyingId: React.Dispatch<React.SetStateAction<string | null>>;
    setOpenMenu: React.Dispatch<React.SetStateAction<string | null>>;
    onRename?: (workspace: Workspace) => void;
    onDelete?: (workspace: Workspace) => void;
}

export default function WorkspaceMenu({
    workspace,
    copyingId,
    setCopyingId,
    setOpenMenu,
    onRename,
    onDelete,
}: WorkspaceMenuProps) {
    const handleCopy = async () => {
        try {
            setCopyingId(workspace._id);

            await navigator.clipboard.writeText(workspace._id);

            setTimeout(() => {
                setCopyingId(null);
                setOpenMenu(null);
            }, 800);
        } catch (error) {
            setCopyingId(null);
        }
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-10 right-0 z-30 w-56 overflow-hidden rounded-xl border border-gray-200 bg-card text-left shadow-xl"
        >
            <button
                type="button"
                onClick={handleCopy}
                disabled={copyingId === workspace._id}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
            >
                {copyingId === workspace._id ? (
                    <>
                        <svg
                            className="h-5 w-5 animate-spin text-gray-500"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />

                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>

                        <span>Copying...</span>
                    </>
                ) : (
                    <>
                        <HiOutlineClipboardDocument className="h-5 w-5 text-gray-500" />
                        <span>Copy Workspace ID</span>
                    </>
                )}
            </button>

            <button
                type="button"
                onClick={() => {
                    setOpenMenu(null);
                    onRename?.(workspace);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
            >
                <HiOutlinePencilSquare className="h-5 w-5 text-gray-500" />
                <span>Rename Workspace</span>
            </button>

            <button
                type="button"
                onClick={() => {
                    setOpenMenu(null);
                    onDelete?.(workspace);
                }}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
            >
                <HiOutlineTrash className="h-5 w-5" />
                <span>Delete Workspace</span>
            </button>
        </div>
    );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    HiOutlineArrowUpRight,
    HiOutlineClipboardDocument,
    HiOutlineEllipsisVertical,
    HiOutlineTrash,
    HiOutlineViewColumns,
} from "react-icons/hi2";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { ChevronRight } from "lucide-react";

interface ModuleUser {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    avatar?: string;
    profileImage?: string;
}

interface Module {
    _id: string;
    name: string;
    description?: string;
    visibility?: string;
    icon?: React.ReactNode;
    performance?: number;
    createdAt?: string;
    createdBy?: ModuleUser;
    graphData?: {
        value: number;
    }[];
}

interface ModuleCardProps {
    module: Module;
    workspaceId: string;
    onDelete: (moduleId: string) => void;
    deletingModuleId?: string | null;
}

export default function ModuleCard({
    module,
    workspaceId,
    onDelete,
    deletingModuleId,
}: ModuleCardProps) {
    const router = useRouter();

    const [showMenu, setShowMenu] = useState(false);
    const [showUserId, setShowUserId] = useState(false);
    const [copied, setCopied] = useState(false);

    const performance = module.performance ?? 0;

    const graphData = module.graphData?.length
        ? module.graphData
        : [
            { value: 72 },
            { value: 70 },
            { value: 63 },
            { value: 64 },
            { value: 69 },
            { value: 61 },
            { value: 60 },
            { value: 56 },
            { value: 59 },
            { value: 67 },
            { value: 63 },
            { value: 55 },
            { value: 49 },
            { value: 47 },
            { value: 43 },
            { value: 38 },
        ];

    const openModule = () => {
        router.push(
            `/workspace/${workspaceId}/module/${module._id}`
        );
    };

    const userName =
        module.createdBy?.name ||
        `${module.createdBy?.firstName || ""} ${module.createdBy?.lastName || ""
            }`.trim() ||
        "Unknown User";

    const userAvatar =
        module.createdBy?.avatar ||
        module.createdBy?.profileImage;

    const userInitials = userName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const createdDate = module.createdAt
        ? new Date(module.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "Recently";

    const copyModuleId = async (
        e: React.MouseEvent
    ) => {
        e.stopPropagation();

        try {
            await navigator.clipboard.writeText(module._id);
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch (error) {
            console.error(
                "Failed to copy module ID:",
                error
            );
        }
    };

    const copyUserId = async (
        e: React.MouseEvent
    ) => {
        e.stopPropagation();

        if (!module.createdBy?._id) return;

        try {
            await navigator.clipboard.writeText(
                module.createdBy._id
            );

            setShowUserId(true);

            setTimeout(() => {
                setShowUserId(false);
            }, 1500);
        } catch (error) {
            console.error(
                "Failed to copy user ID:",
                error
            );
        }
    };

    const handleDelete = (
        e: React.MouseEvent
    ) => {
        e.stopPropagation();

        setShowMenu(false);
        onDelete(module._id);
    };

    return (
        <div
            onClick={openModule}
            className="group w-full max-w-[360px] rounded-[22px] border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
        >
            <div className="p-4 sm:p-5">

                {/* Header */}
                <div className="flex items-start justify-between gap-3">

                    {/* Module information */}
                    <div className="flex items-center gap-3 min-w-0">


                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 truncate font-dmsans">
                                {module.name}
                            </h3>

                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-slate-400">
                                    {createdDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right header actions */}
                    <div className="relative flex items-center gap-1.5 shrink-0">

                        {/* Creator profile */}
                        <button
                            onClick={copyUserId}
                            title={`Created by ${userName}`}
                            className="relative w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-orange-200 transition"
                        >
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-[11px] font-semibold text-slate-600">
                                    {userInitials}
                                </span>
                            )}

                            {showUserId && (
                                <span className="absolute inset-0 flex items-center justify-center bg-orange-500 text-white text-[8px] font-semibold">
                                    ID
                                </span>
                            )}
                        </button>

                        {/* Three dots */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu((value) => !value);
                            }}
                            className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                            aria-label="Module options"
                        >
                            <HiOutlineEllipsisVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown */}
                        {showMenu && (
                            <div
                                onClick={(e) =>
                                    e.stopPropagation()
                                }
                                className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                            >
                                <button
                                    onClick={openModule}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <HiOutlineArrowUpRight className="w-4 h-4" />
                                    Open Module
                                </button>

                                <button
                                    onClick={copyModuleId}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <span className="flex items-center gap-2">
                                        <HiOutlineClipboardDocument className="w-4 h-4" />
                                        Copy Module ID
                                    </span>

                                    {copied && (
                                        <span className="text-[9px] text-orange-500">
                                            Copied
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={copyUserId}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <HiOutlineClipboardDocument className="w-4 h-4" />
                                    Copy Creator ID
                                </button>

                                <div className="h-px bg-slate-100 my-1" />

                                <button
                                    onClick={handleDelete}
                                    disabled={
                                        deletingModuleId ===
                                        module._id
                                    }
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                                >
                                    <HiOutlineTrash className="w-4 h-4" />

                                    {deletingModuleId ===
                                        module._id
                                        ? "Deleting..."
                                        : "Delete Module"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                
                {/* Graph foreground card */}
                <div className="mt-4 rounded-[18px] bg-slate-70 border border-slate-200 overflow-hidden">

                    {/* Graph header */}
                    <div className="flex items-end justify-between px-4 pt-4">

                        <div>
                            <p className="text-[11px] text-slate-400">
                                Performance
                            </p>

                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                                    {performance}
                                </span>

                                <span className="text-sm text-slate-500">
                                    %
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                openModule();
                            }}
                            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-orange-50 transition cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 text-slate-700" />
                        </button>
                    </div>

                    {/* Curved graph */}
                    <div className="w-full h-[115px] mt-1 px-2">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <AreaChart
                                data={graphData}
                                margin={{
                                    top: 8,
                                    right: 4,
                                    left: 4,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id={`orangeGradient-${module._id}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#F28C28"
                                            stopOpacity={0.22}
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor="#F28C28"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>

                                <Tooltip
                                    cursor={false}
                                    content={() => null}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#F28C28"
                                    strokeWidth={2.5}
                                    fill={`url(#orangeGradient-${module._id})`}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: "#F28C28",
                                        stroke: "#fff",
                                        strokeWidth: 2,
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Graph scale */}
                    <div className="flex items-center gap-[5px] px-4 pb-3 overflow-hidden">
                        {Array.from({ length: 48 }).map(
                            (_, index) => (
                                <span
                                    key={index}
                                    className="w-px h-2 bg-slate-300 shrink-0"
                                />
                            )
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
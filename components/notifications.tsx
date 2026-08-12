import { useEffect, useRef } from "react";
import { HiOutlineBell } from "react-icons/hi2";

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
}

interface NotificationDropdownProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    notifications: Notification[];
    onViewAll?: () => void;
}

export default function NotificationDropdown({
    open,
    setOpen,
    notifications,
    onViewAll,
}: NotificationDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="bg-white p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition z-30"
            >
                <HiOutlineBell size={18} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-10">

                    <div className="px-4 py-3 border-b">
                        <h2 className="font-semibold text-gray-800">
                            Notifications
                        </h2>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                No notifications
                            </p>
                        ) : (
                            notifications.map((item) => (
                                <button
                                    key={item.id}
                                    className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition"
                                >
                                    <p className="font-medium text-sm text-gray-900">
                                        {item.title}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        {item.message}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-2">
                                        {item.time}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t">
                        <button
                            onClick={onViewAll}
                            className="w-full py-2 rounded-xl bg-[#0D1B2A] text-white text-sm font-medium hover:bg-[#16283d] transition cursor-pointer"
                        >
                            View All
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}
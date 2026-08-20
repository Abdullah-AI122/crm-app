"use client";

import { useRef } from "react";

interface ResizeHandleProps {
    onResize: (delta: number) => void;
}

export default function ResizeHandle({
    onResize,
}: ResizeHandleProps) {
    const startX = useRef(0);
    const dragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dragging.current = true;
        startX.current = e.clientX;

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        const onMouseMove = (ev: MouseEvent) => {
            if (!dragging.current) return;

            const delta = ev.clientX - startX.current;
            startX.current = ev.clientX;

            onResize(delta);
        };

        const onMouseUp = () => {
            dragging.current = false;

            document.body.style.cursor = "";
            document.body.style.userSelect = "";

            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            className="absolute top-0 right-0 z-20 h-full w-1.5 cursor-col-resize hover:bg-[#415A77]/40 active:bg-[#415A77]/60"
            style={{ transform: "translateX(50%)" }}
            title="Drag to resize"
        />
    );
}
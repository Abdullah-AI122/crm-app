import DeveloperSidebar from "@/components/developerSidebar";

export default function DeveloperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-canvas">
            <DeveloperSidebar />

            <div className="flex-1 min-w-0 px-8 py-8">{children}</div>
        </div>
    );
}

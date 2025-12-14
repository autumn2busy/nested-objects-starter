import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-obsidian text-foreground selection:bg-gold-500/30">
            <Sidebar />
            <div className="md:ml-64 min-h-screen relative flex flex-col">
                {/* Mobile Header (Placeholder for verify step) */}
                <div className="md:hidden h-16 border-b border-white/10 flex items-center px-4 justify-between bg-black/40 backdrop-blur-md sticky top-0 z-30">
                    <span className="font-bold text-white">Nested Objects</span>
                    <button className="text-white/60">Menu</button>
                </div>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 lg:p-12 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </main>
            </div>
        </div>
    );
}

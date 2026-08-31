import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ContentProtection } from "@/components/ContentProtection";
import { getCurrentUser } from "@/lib/auth-server";

const OUTSETA_LOGIN_URL = "https://nested-objects.outseta.com/auth?widgetMode=login#o-anonymous";

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect(OUTSETA_LOGIN_URL);
    }

    return (
        <div className="flex min-h-screen">
            <ContentProtection />
            <div className="hidden md:block w-64 flex-shrink-0">
                <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}

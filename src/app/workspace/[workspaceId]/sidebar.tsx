import { UserButton } from "@/features/auth/components/user-button";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarButton } from "./sidebar-button";
import { Activity, Home, MessagesSquare, MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { ActivityModal } from "@/features/activities/components/activity-modal";

export const Sidebar = () => {
    const pathname = usePathname();
    const [isActivityOpen, setIsActivityOpen] = useState(false);

    // Extract workspaceId from pathname
    const workspaceId = pathname.split('/')[2] as Id<"workspaces">;

    return (
        <>
            <aside className="w-17.5 h-full bg-[oklch(35.5%_0.07_142)] flex flex-col gap-y-4 items-center pt-2.25 pb-4">
                <WorkspaceSwitcher />
                <SidebarButton icon={Home} lebel="Home" isActive={pathname.includes("/workspace")} />
                <SidebarButton icon={MessagesSquare} lebel="DM" />
                <SidebarButton 
                    icon={Activity} 
                    lebel="Activity" 
                    isActive={false}
                    onClick={() => setIsActivityOpen(true)}
                />
                <SidebarButton icon={MoreHorizontal} lebel="More" />
                <div className="flex flex-col item-center justify-center gap-y-1 mt-auto">
                    <UserButton />
                </div>
            </aside>

            {/* Activity Modal */}
            {workspaceId && (
                <ActivityModal
                    open={isActivityOpen}
                    onOpenChange={setIsActivityOpen}
                    workspaceId={workspaceId}
                />
            )}
        </>
    );
};
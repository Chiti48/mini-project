import { UserButton } from "@/features/auth/components/user-button";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarButton } from "./sidebar-button";
import { Activity, Home, MessagesSquare, MoreHorizontal, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { ActivityModal } from "@/features/activities/components/activity-modal";
import { MobileSidebarToggle } from "@/components/ui/mobile-sidebar-toggle";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { FriendsSidebar } from "@/features/friends/components/friends-sidebar"; 


export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isActivityOpen, setIsActivityOpen] = useState(false);
    const [isFriendsOpen, setIsFriendsOpen] = useState(false);
    const { isOpen, toggle } = useMobileSidebar();

    const workspaceId = pathname.split('/')[2] as Id<"workspaces">;

    return (
        <>
            <aside className="w-17.5 h-full bg-[oklch(35.5%_0.07_142)] flex flex-col gap-y-4 items-center pt-2.25 pb-4">
                <WorkspaceSwitcher />
                <SidebarButton 
                    icon={Home} 
                    label="Home" 
                    isActive={pathname.includes("/workspace")} 
                    onClick={() => {
                        window.location.href = "/";
                    }}
                />
                <SidebarButton 
                    icon={MessagesSquare} 
                    label="DM" 
                    onClick={() => {}}
                />
                <SidebarButton
                    icon={User}
                    label="Friends"
                    isActive={isFriendsOpen}
                    onClick={() => setIsFriendsOpen(!isFriendsOpen)}
                />
                <SidebarButton 
                    icon={Activity} 
                    label="Activity" 
                    isActive={false}
                    onClick={() => setIsActivityOpen(true)}
                />
                <SidebarButton 
                    icon={MoreHorizontal} 
                    label="More" 
                    onClick={() => toggle()}
                />
                
                {/* ส่วนล่างสุดของ Sidebar (mt-auto จะดันทุกอย่างในนี้ลงไปติดขอบล่าง) */}
                <div className="flex flex-col items-center justify-center gap-y-4 mt-auto">
                    {/* ย้ายปุ่ม Hamburger มาไว้ตรงนี้เหนือ UserButton */}
                    <MobileSidebarToggle 
                        isOpen={isOpen} 
                        onToggle={toggle} 
                        className="text-white"
                    />
                    <UserButton />
                </div>
            </aside>

            {/* Friends Sidebar */}
            {isFriendsOpen && (
                <div className="absolute left-[70px] top-0 bottom-0 w-80 z-40 shadow-lg">
                    <FriendsSidebar workspaceId={workspaceId} />
                </div>
            )}

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
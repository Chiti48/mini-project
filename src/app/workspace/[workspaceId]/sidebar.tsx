import { UserButton } from "@/features/auth/components/user-button";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarButton } from "./sidebar-button";
import { Bell, Home, MessagesSquare, MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";

export const Sidebar = () => {

    const pathname = usePathname();

    return (
        <aside className="w-17.5 h-full bg-[#481349] flex flex-col gap-y-4 items-center pt-2.25 pb-4">
            <WorkspaceSwitcher />
            <SidebarButton icon={Home} lebel="Home" isActive={pathname.includes("/workspace")} />
            <SidebarButton icon={MessagesSquare} lebel="DM" />
            <SidebarButton icon={Bell} lebel="Activity" />
            <SidebarButton icon={MoreHorizontal} lebel="More" />
            <div className="flex flex-col item-center justify-center gap-y-1 mt-auto">
                <UserButton />
            </div>
        </aside>
    );
};
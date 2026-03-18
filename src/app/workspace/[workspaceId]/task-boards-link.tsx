"use client";

import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons";

interface TaskBoardsLinkProps {
    label: string;
    icon: LucideIcon | IconType;
    onClick?: () => void
}

export const TaskBoardsLink = ({ label, icon: Icon, onClick }: TaskBoardsLinkProps) => {
    const workspaceId = useWorkspaceId();
    const pathname = usePathname();
    const isActive = pathname?.includes("/tasks");

    return (
        <Button
            variant="transparent"
            size="sm"
            className={cn(
                "flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden transition-colors duration-200",
                isActive 
                    ? "text-[#337f37] bg-white/90 hover:bg-white/90 font-medium" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
            )}
            asChild
            onClick={onClick}
        >
            <Link href={`/workspace/${workspaceId}/tasks`}>
                <Icon className="size-3.5 mr-1 shrink-0" />
                <span className="text-sm truncate hidden sm:inline">{label}</span>
                <span className="text-sm truncate sm:hidden">
                    {label.length > 12 ? `${label.slice(0, 12)}...` : label}
                </span>
            </Link>
        </Button>
    );
};
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
}

export const TaskBoardsLink = ({ label, icon: Icon }: TaskBoardsLinkProps) => {
    const workspaceId = useWorkspaceId();
    const pathname = usePathname();
    const isActive = pathname?.includes("/tasks");

    return (
        <Button
            variant="transparent"
            size="sm"
            className={cn(
                "flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden",
                isActive ? "text-[#481349] bg-white/90 hover:bg-white/90" : "text-[#f9edffcc]"
            )}
            asChild
        >
            <Link href={`/workspace/${workspaceId}/tasks`}>
                <Icon className="size-3.5 mr-1 shrink-0" />
                <span className="text-sm truncate">{label}</span>
            </Link>
        </Button>
    );
};

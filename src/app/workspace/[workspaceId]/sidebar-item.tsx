import { Button } from "@/components/ui/button"
import { useWorkspaceId } from "@/hooks/use-workspace-id"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { IconType } from "react-icons"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const sidebarItemVariants = cva(
    "flex items-center gap-1.5 justify-start font-normal h-7 px-[18px] text-sm overflow-hidden transition-colors duration-200",
    {
        variants: {
            variant: {
                default: "text-white/70 hover:text-white hover:bg-white/10",
                active: "text-[#337f37] bg-white/90 hover:bg-white/90 font-medium",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

interface SidebarItemProps {
    label: string
    id: string
    icon: LucideIcon | IconType
    variant?: VariantProps<typeof sidebarItemVariants>["variant"]
    onClick?: () => void
};

export const SidebarItem = ({
    label,
    id,
    icon: Icon,
    variant,
    onClick,
}: SidebarItemProps) => {
    const workspaceId = useWorkspaceId();

    return (
        <Button
            variant="transparent"
            size="sm"
            className={cn(sidebarItemVariants({ variant }))}
            asChild
            onClick={onClick}
        >
            <Link href={`/workspace/${workspaceId}/channel/${id}`}>
                <Icon className="size-3.5 mr-1 shrink-0" />
                <span className="text-sm truncate hidden sm:inline">{label}</span>
                <span className="text-sm truncate sm:hidden">
                    {label.length > 12 ? `${label.slice(0, 12)}...` : label}
                </span>
            </Link>
        </Button>
    );
};
import { Button } from "@/components/ui/button"
import { Hash } from "lucide-react"
import { cn } from "@/lib/utils"
import { Id } from "../../../../convex/_generated/dataModel"
import { UnreadBadge } from "@/features/notifications/components/unread-badge"
import { useMarkChannelAsRead } from "@/features/notifications/api/use-read-receipts"

interface ChannelItemProps {
    label: string
    channelId: Id<"channels">
    isActive?: boolean
    onClick?: () => void
}

export const ChannelItem = ({
    label,
    channelId,
    isActive = false,
    onClick,
}: ChannelItemProps) => {
    const markChannelAsRead = useMarkChannelAsRead();

    const handleClick = () => {
        // Mark channel as read when clicked
        markChannelAsRead(channelId);
        // Call the original onClick handler (navigation)
        onClick?.();
    };

    return (
        <Button
            variant="transparent"
            size="sm"
            className={cn(
                "flex items-center gap-1.5 justify-start font-normal h-7 px-4.5 text-sm overflow-hidden w-full transition-colors duration-200",
                isActive
                    ? "text-[#481349] bg-white/90 hover:bg-white/90"
                    : "text-[#f9edffcc] hover:text-white"
            )}
            onClick={handleClick}
        >
            <Hash className="size-3.5 mr-1 shrink-0" />
            <span className="text-sm truncate text-left flex-1 hidden sm:inline">{label}</span>
            <span className="text-sm truncate text-left flex-1 sm:hidden">{label.slice(0, 8)}...</span>
            <UnreadBadge channelId={channelId} className="ml-auto shrink-0" />
        </Button>
    );
};

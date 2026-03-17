import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Id } from "../../../../convex/_generated/dataModel";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { ConversationUnreadBadge } from "@/features/notifications/components/conversation-unread-badge";
import { useMarkConversationAsRead } from "@/features/notifications/api/use-read-receipts";
import { useGetConversationBetweenMembers } from "@/features/conversations/api/use-conversation";

const userItemVariants = cva(
    "flex items-center gap-1.5 justify-start font-normal h-7 px-4 text-sm overflow-hidden",
    {
        variants: {
            variant: {
                default: "text-[#f9edffcc]",
                active: "text-[#0b4c0e] bg-white/90 hover:bg-white/90",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

interface UserItemProps {
    id: Id<"members">;
    label?: string;
    image?: string;
    variant?: VariantProps<typeof userItemVariants>["variant"];
    onClick?: () => void;
}

export const UserItem = ({
    id,
    label = "Member",
    image,
    variant,
    onClick,

}: UserItemProps) => {
    const workspaceId = useWorkspaceId();
    const conversationId = useGetConversationBetweenMembers(id, workspaceId);
    const markConversationAsRead = useMarkConversationAsRead();
    const avatarFallback = label.charAt(0).toUpperCase();

    const handleClick = () => {
        // Mark conversation as read when clicked
        if (conversationId) {
            markConversationAsRead(conversationId);
        }
        // Call the original onClick handler (navigation)
        onClick?.();
    };

    return (
        <Button
            variant="transparent"
            className={cn(userItemVariants({ variant: variant }))}
            size="sm"
            onClick={handleClick}
        >
            <Avatar className="size-5 rounded-md mr-1">
                <AvatarImage className="rounded-md" src={image} />
                <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                    {avatarFallback}
                </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate flex-1 text-left"> {label} </span>
            <ConversationUnreadBadge memberId={id} className="ml-auto" />
        </Button>
    );
};
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
    "flex items-center gap-1.5 justify-start font-normal h-7 px-4 text-sm overflow-hidden transition-colors duration-200",
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
        if (conversationId) {
            markConversationAsRead(conversationId);
        }
        onClick?.();
    };

    return (
        <Button
            variant="transparent"
            className={cn(userItemVariants({ variant: variant }))}
            size="sm"
            onClick={handleClick}
        >
            <Avatar className="size-5 rounded-md mr-1 shrink-0">
                <AvatarImage className="rounded-md" src={image} />
                <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                    {avatarFallback}
                </AvatarFallback>
            </Avatar>
            
            <span className="text-sm truncate flex-1 text-left hidden sm:inline">
                {label}
            </span>
            
            <span className="text-sm truncate flex-1 text-left sm:hidden">
                {label.length > 12 ? `${label.slice(0, 12)}...` : label}
            </span>
            
            <ConversationUnreadBadge memberId={id} className="ml-auto shrink-0" />
        </Button>
    );
};
import { Id } from "../../../../convex/_generated/dataModel";
import { useGetConversationUnreadCount } from "../api/use-read-receipts";
import { useGetConversationBetweenMembers } from "@/features/conversations/api/use-conversation";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { cn } from "@/lib/utils";

interface ConversationUnreadBadgeProps {
  memberId: Id<"members">;
  className?: string;
}

// Inner component that always calls the hook
const ConversationUnreadBadgeInner = ({ conversationId, className }: {
  conversationId: Id<"conversations">;
  className?: string;
}) => {
  const unreadCount = useGetConversationUnreadCount(conversationId);
  const count = unreadCount !== undefined ? unreadCount : 0;
  const hasUnread = count > 0;

  return (
    <div className={cn("relative flex items-center", className)}>
      {hasUnread ? (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
          <span className="font-bold text-white text-xs">
            {count > 9 ? "9+" : count}
          </span>
        </div>
      ) : (
        <div className="w-2 h-2 bg-transparent"></div>
      )}
    </div>
  );
};

export const ConversationUnreadBadge = ({ memberId, className = "" }: ConversationUnreadBadgeProps) => {
  const workspaceId = useWorkspaceId();
  const conversationId = useGetConversationBetweenMembers(memberId, workspaceId);

  // Only render the inner component if conversation exists
  if (!conversationId) {
    return (
      <div className={cn("relative flex items-center", className)}>
        <div className="w-2 h-2 bg-transparent"></div>
      </div>
    );
  }

  return <ConversationUnreadBadgeInner conversationId={conversationId} className={className} />;
};

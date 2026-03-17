import { Id } from "../../../../convex/_generated/dataModel";
import { useGetUnreadCount } from "../api/use-read-receipts";
import { cn } from "@/lib/utils";


interface UnreadBadgeProps {
  channelId: Id<"channels">;
  className?: string;
}

export const UnreadBadge = ({ channelId, className = "" }: UnreadBadgeProps) => {
  const unreadCount = useGetUnreadCount(channelId);
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
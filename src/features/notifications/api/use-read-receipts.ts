import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Hook to mark channel as read
export const useMarkChannelAsRead = () => {
  const markAsRead = useMutation(api.readReceipts.markChannelAsRead);

  return (channelId: Id<"channels">) => {
    return markAsRead({ channelId });
  };
};

// Hook to mark conversation as read
export const useMarkConversationAsRead = () => {
  const markAsRead = useMutation(api.readReceipts.markConversationAsRead);

  return (conversationId: Id<"conversations">) => {
    return markAsRead({ conversationId });
  };
};

// Hook to get unread count for a specific channel
export const useGetUnreadCount = (channelId: Id<"channels">) => {
  return useQuery(api.readReceipts.getUnreadCount, { channelId });
};

// Hook to get unread count for a specific conversation
export const useGetConversationUnreadCount = (conversationId: Id<"conversations">) => {
  return useQuery(api.readReceipts.getConversationUnreadCount, { conversationId });
};

// Hook to get total unread count in workspace
export const useGetTotalUnreadCount = (workspaceId: Id<"workspaces">) => {
  return useQuery(api.readReceipts.getTotalUnreadCount, { workspaceId });
};

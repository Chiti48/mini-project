import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetConversationBetweenMembers = (memberId: Id<"members">, workspaceId: Id<"workspaces">) => {
  return useQuery(api.conversation.getConversationBetweenMembers, { memberId, workspaceId });
};

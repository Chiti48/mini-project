import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";

// Hook to get all direct conversations
export const useGetDirectConversations = () => {
    const data = useQuery(api.directConversations.getConversations);
    
    return {
        data,
        isLoading: data === undefined,
    };
};

// Hook to get a specific conversation
export const useGetDirectConversation = (conversationId: Id<"directConversations"> | undefined) => {
    const data = useQuery(
        api.directConversations.getById,
        conversationId ? { conversationId } : "skip"
    );
    
    return {
        data,
        isLoading: data === undefined && conversationId !== undefined,
    };
};

// Hook to get messages for a conversation (paginated)
export const useGetDirectMessages = (conversationId: Id<"directConversations"> | undefined) => {
    const { results, status, loadMore } = usePaginatedQuery(
        api.directConversations.getMessages,
        conversationId ? { conversationId } : "skip",
        { initialNumItems: 20 }
    );
    
    return {
        results,
        status,
        loadMore,
        isLoading: status === "LoadingFirstPage",
    };
};

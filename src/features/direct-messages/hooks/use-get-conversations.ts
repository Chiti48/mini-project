import { useQuery, usePaginatedQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const PAGE_SIZE = 20;

// Hook to get paginated direct conversations
export const useGetDirectConversations = () => {
    const [cursor, setCursor] = useState(0);
    const [allConversations, setAllConversations] = useState<NonNullable<ReturnType<typeof useQuery<typeof api.directConversations.getConversations>>>["conversations"]>([]);

    const data = useQuery(api.directConversations.getConversations, {
        limit: PAGE_SIZE,
        cursor,
    });

    // Accumulate pages as user loads more
    useEffect(() => {
        if (data?.conversations) {
            if (cursor === 0) {
                // First page — reset list (e.g. after new message reorders)
                setAllConversations(data.conversations);
            } else {
                // Subsequent pages — append
                setAllConversations((prev) => [...prev, ...data.conversations]);
            }
        }
    }, [data, cursor]);

    const loadMore = () => {
        if (data?.hasMore) {
            setCursor((prev) => prev + PAGE_SIZE);
        }
    };

    return {
        conversations: allConversations,
        isLoading: data === undefined,
        hasMore: data?.hasMore ?? false,
        total: data?.total ?? 0,
        loadMore,
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

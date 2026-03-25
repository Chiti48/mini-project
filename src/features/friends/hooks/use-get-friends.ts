import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Hook to get all friends
export const useGetFriends = () => {
    const data = useQuery(api.friends.getFriends);
    
    return {
        data,
        isLoading: data === undefined,
    };
};

// Hook to get pending friend requests
export const useGetPendingRequests = () => {
    const data = useQuery(api.friends.getPendingRequests);
    
    return {
        data,
        isLoading: data === undefined,
    };
};

// Hook to get sent friend requests
export const useGetSentRequests = () => {
    const data = useQuery(api.friends.getSentRequests);
    
    return {
        data,
        isLoading: data === undefined,
    };
};

// Hook to search users
export const useSearchUsers = (query: string) => {
    const data = useQuery(api.friends.searchUsers, { query });
    
    return {
        data,
        isLoading: data === undefined,
    };
};

// Hook to check friendship status
export const useGetFriendshipStatus = (otherUserId: Id<"users">) => {
    const data = useQuery(api.friends.getFriendshipStatus, { otherUserId });
    
    return {
        data,
        isLoading: data === undefined,
    };
};

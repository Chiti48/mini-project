import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Hook to send friend request
export const useSendFriendRequest = () => {
    const mutate = useMutation(api.friends.sendRequest);
    
    const sendRequest = async (receiverId: Id<"users">) => {
        return await mutate({ receiverId });
    };
    
    return { sendRequest };
};

// Hook to accept friend request
export const useAcceptFriendRequest = () => {
    const mutate = useMutation(api.friends.acceptRequest);
    
    const acceptRequest = async (requestId: Id<"friendRequests">) => {
        return await mutate({ requestId });
    };
    
    return { acceptRequest };
};

// Hook to reject friend request
export const useRejectFriendRequest = () => {
    const mutate = useMutation(api.friends.rejectRequest);
    
    const rejectRequest = async (requestId: Id<"friendRequests">) => {
        return await mutate({ requestId });
    };
    
    return { rejectRequest };
};

// Hook to remove friend
export const useRemoveFriend = () => {
    const mutate = useMutation(api.friends.removeFriend);
    
    const removeFriend = async (friendId: Id<"users">) => {
        return await mutate({ friendId });
    };
    
    return { removeFriend };
};

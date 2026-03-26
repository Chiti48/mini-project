import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Hook to create or get a direct conversation
export const useCreateDirectConversation = () => {
    const mutate = useMutation(api.directConversations.createOrGet);
    
    const createConversation = async (otherUserId: Id<"users">) => {
        return await mutate({ otherUserId });
    };
    
    return { createConversation };
};

// Hook to send a direct message
export const useSendDirectMessage = () => {
    const mutate = useMutation(api.directConversations.sendMessage);
    
    const sendMessage = async (
        conversationId: Id<"directConversations">,
        body: string,
        image?: Id<"_storage">,
        attachments?: { id: Id<"_storage">; name: string }[]
    ) => {
        return await mutate({ conversationId, body, image, attachments });
    };
    
    return { sendMessage };
};

// Hook to update read receipt
export const useUpdateReadReceipt = () => {
    const mutate = useMutation(api.directConversations.updateReadReceipt);
    
    const updateReadReceipt = async (
        conversationId: Id<"directConversations">,
        lastReadMessageId?: Id<"directMessages">
    ) => {
        return await mutate({ conversationId, lastReadMessageId });
    };
    
    return { updateReadReceipt };
};

// Hook to delete a conversation
export const useDeleteConversation = () => {
    const mutate = useMutation(api.directConversations.deleteConversation);
    
    const deleteConversation = async (conversationId: Id<"directConversations">) => {
        return await mutate({ conversationId });
    };
    
    return { deleteConversation };
};

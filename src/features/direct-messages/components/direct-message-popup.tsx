"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { useGetDirectConversation, useGetDirectMessages } from "../hooks/use-get-conversations";
import { useUpdateReadReceipt } from "../hooks/use-conversation-actions";
import { DmHeader } from "./dm-header";
import { DmMessageList } from "./dm-message-list";
import { DmChatInput } from "./dm-chat-input";

interface DirectMessageChatProps {
    conversationId: Id<"directConversations">;
    workspaceId?: string;
}

export const DirectMessageChat = ({ conversationId, workspaceId }: DirectMessageChatProps) => {
    const router = useRouter();

    const { data: conversation, isLoading: conversationLoading } = useGetDirectConversation(conversationId);
    const { data: currentUser } = useCurrentUser();
    const { results: messages, status, loadMore } = useGetDirectMessages(conversationId);
    const { updateReadReceipt } = useUpdateReadReceipt();

    // Auto-mark as read when messages load
    useEffect(() => {
        if (conversationId && messages?.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage) {
                updateReadReceipt(conversationId, lastMessage._id);
            }
        }
    }, [conversationId, messages, updateReadReceipt]);

    const handleBack = () => {
        if (workspaceId) {
            router.push(`/workspace/${workspaceId}`);
        } else {
            router.push("/");
        }
    };

    if (conversationLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <Loader className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="h-full flex items-center justify-center flex-col gap-3 bg-background">
                <p className="text-muted-foreground font-medium">Conversation not found</p>
                <Button variant="outline" onClick={handleBack} className="rounded-full">
                    <ArrowLeft className="size-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const otherUser = conversation.otherUser;

    return (
        <div className="flex flex-col h-full bg-background">
            <DmHeader
                name={otherUser?.name ?? undefined}
                image={otherUser?.image ?? undefined}
                email={otherUser?.email ?? undefined}
                onBack={handleBack}
            />
            <DmMessageList
                messages={messages ?? []}
                currentUserId={currentUser?._id}
                otherUser={otherUser}
                loadMore={loadMore}
                status={status}
            />
            <DmChatInput
                conversationId={conversationId}
                placeholder={`Message ${otherUser?.name?.split(" ")[0] ?? "..."}`}
            />
        </div>
    );
};
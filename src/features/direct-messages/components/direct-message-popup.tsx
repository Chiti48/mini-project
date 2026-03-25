"use client";

import { useEffect, useState, useRef } from "react";
import { useGetDirectConversation, useGetDirectMessages } from "../hooks/use-get-conversations";
import { useSendDirectMessage, useUpdateReadReceipt } from "../hooks/use-conversation-actions";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload";
import { useCurrentUser } from "@/features/auth/api/use-current-user";
import { Id } from "../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader, ArrowLeft } from "lucide-react";
import { format, differenceInMinutes, isToday, isYesterday } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import Quill from "quill";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

const TIME_THRESHOLD = 5;

const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d");
};

// Helper function to convert Delta JSON to plain text
const getTextFromBody = (body: string): string => {
    try {
        const parsed = JSON.parse(body);
        if (parsed.ops && Array.isArray(parsed.ops)) {
            return parsed.ops
                .map((op: { insert?: string }) => op.insert || "")
                .join("")
                .trim();
        }
    } catch {
        // Not JSON, return as-is
    }
    return body;
};

interface DirectMessageChatProps {
    conversationId: Id<"directConversations">;
    workspaceId?: string;
}

export const DirectMessageChat = ({ conversationId, workspaceId }: DirectMessageChatProps) => {
    const router = useRouter();
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPending] = useState(false);
    const editorRef = useRef<Quill | null>(null);

    const { data: conversation, isLoading: conversationLoading } = useGetDirectConversation(conversationId);
    const { data: currentUser } = useCurrentUser();
    const { results: messages, status, loadMore, isLoading: isLoadingMore } = useGetDirectMessages(conversationId);
    const { sendMessage } = useSendDirectMessage();
    const { updateReadReceipt } = useUpdateReadReceipt();
    const { mutate: generateUploadUrl } = useGenerateUploadUrl();

    // Update read receipt when viewing conversation
    useEffect(() => {
        if (conversationId && messages?.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage) {
                updateReadReceipt(conversationId, lastMessage._id);
            }
        }
    }, [conversationId, messages, updateReadReceipt]);

    const handleSubmit = async ({
        body,
        image,
        file
    }: {
        body: string;
        image: File | null;
        file: File | null;
    }) => {
        try {
            setIsPending(true);
            editorRef?.current?.enable(false);

            let imageStorageId: Id<"_storage"> | undefined = undefined;

            // Upload image
            if (image) {
                const url = await generateUploadUrl({ throwError: true });
                if (!url) throw new Error("Url not found");

                const result = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": image.type },
                    body: image,
                });

                if (!result.ok) throw new Error("Failed to upload image");

                const { storageId } = await result.json();
                imageStorageId = storageId;
            }

            // Upload file as image
            if (file) {
                const url = await generateUploadUrl({ throwError: true });
                if (!url) throw new Error("Url not found");

                const result = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": file.type || "application/octet-stream" },
                    body: file,
                });

                if (!result.ok) throw new Error("Failed to upload file");

                const { storageId } = await result.json();
                imageStorageId = storageId;
            }

            await sendMessage(conversationId, body, imageStorageId);
            setEditorKey((prev) => prev + 1);
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
        } finally {
            setIsPending(false);
            editorRef?.current?.enable(true);
        }
    };

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
    const currentUserId = currentUser?._id;

    // Group messages by date
    const groupedMessages = messages?.reduce(
        (groups, message) => {
            const date = new Date(message._creationTime);
            const dateKey = format(date, "yyyy-MM-dd");
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].unshift(message);
            return groups;
        },
        {} as Record<string, typeof messages>
    );

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header - similar to member/[memberId]/header.tsx */}
            <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="mr-2 shrink-0"
                >
                    <ArrowLeft className="size-5 text-muted-foreground" />
                </Button>
                <Button
                    variant="ghost"
                    className="text-lg font-semibold px-2 overflow-hidden w-auto h-auto py-0"
                    size="sm"
                >
                    <Avatar className="size-8 mr-2">
                        <AvatarImage src={otherUser?.image} />
                        <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                            {(otherUser?.name?.[0] || otherUser?.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{otherUser?.name || otherUser?.email || "Unknown"}</span>
                </Button>
            </div>

            {/* Message List - similar to MessageList component */}
            <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
                {groupedMessages && Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                    <div key={dateKey}>
                        <div className="text-center my-2 relative">
                            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                                {formatDateLabel(dateKey)}
                            </span>
                        </div>
                        {dateMessages.map((message, index) => {
                            const prevMessage = dateMessages[index - 1];
                            const isOtherUser = message.senderId !== currentUserId;
                            const isCompact =
                                prevMessage &&
                                prevMessage.senderId === message.senderId &&
                                differenceInMinutes(
                                    new Date(message._creationTime),
                                    new Date(prevMessage._creationTime)
                                ) < TIME_THRESHOLD;

                            const senderImage = isOtherUser ? otherUser?.image : undefined;
                            const senderName = isOtherUser ? otherUser?.name : "You";
                            const senderEmail = isOtherUser ? otherUser?.email : undefined;
                            const avatarFallback = isOtherUser 
                                ? (otherUser?.name?.[0] || otherUser?.email?.[0] || "?").toUpperCase()
                                : "Y";

                            if (isCompact) {
                                return (
                                    <div
                                        key={message._id}
                                        className="flex items-start gap-3 px-4 py-1 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="size-10 shrink-0" />
                                        <div className="flex flex-col w-full overflow-hidden">
                                            <p className="text-[15px] text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
                                                {getTextFromBody(message.body)}
                                            </p>
                                            {message.image && (
                                                <div className="mt-2">
                                                    <img
                                                        src={message.image}
                                                        alt="Message attachment"
                                                        className="max-w-[280px] sm:max-w-sm rounded-xl border shadow-sm object-cover hover:opacity-90 transition-opacity cursor-pointer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={message._id}
                                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                                >
                                    <Avatar className="size-10 shrink-0 shadow-sm border">
                                        <AvatarImage src={senderImage} />
                                        <AvatarFallback className={cn(
                                            "text-white text-sm font-medium rounded-md",
                                            isOtherUser ? "bg-sky-500" : "bg-primary"
                                        )}>
                                            {avatarFallback}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col w-full overflow-hidden">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {senderName || senderEmail || "Unknown"}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                {format(new Date(message._creationTime), "h:mm a")}
                                            </span>
                                        </div>
                                        <p className="text-[15px] text-foreground/90 leading-relaxed break-words whitespace-pre-wrap mt-1">
                                            {getTextFromBody(message.body)}
                                        </p>
                                        {message.image && (
                                            <div className="mt-2">
                                                <img
                                                    src={message.image}
                                                    alt="Message attachment"
                                                    className="max-w-[280px] sm:max-w-sm rounded-xl border shadow-sm object-cover hover:opacity-90 transition-opacity cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* Load more trigger */}
                <div
                    className="h-1"
                    ref={(el) => {
                        if (el) {
                            const observer = new IntersectionObserver(
                                ([entry]) => {
                                    if (entry.isIntersecting && status === "CanLoadMore") {
                                        loadMore(20);
                                    }
                                },
                                { threshold: 1.0 }
                            );
                            observer.observe(el);
                            return () => observer.disconnect();
                        }
                    }}
                />

                {isLoadingMore && (
                    <div className="text-center my-2 relative">
                        <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                        <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                            <Loader className="size-4 animate-spin" />
                        </span>
                    </div>
                )}
            </div>

            {/* Chat Input - similar to member/[memberId]/chat-input.tsx */}
            <div className="px-5 pb-4 bg-background shrink-0">
                <Editor
                    key={editorKey}
                    placeholder={`Message ${otherUser?.name?.split(' ')[0] || '...'}`}
                    onSubmit={handleSubmit}
                    disabled={isPending}
                    innerRef={editorRef}
                />
            </div>
        </div>
    );
};
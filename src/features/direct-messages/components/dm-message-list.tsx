"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader } from "lucide-react";
import { format, differenceInMinutes, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";
import { Thumbnail } from "@/components/thumbnail";

const TIME_THRESHOLD = 5;

const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMMM d");
};

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

interface DirectMessage {
    _id: Id<"directMessages">;
    _creationTime: number;
    body: string;
    senderId: Id<"users">;
    image?: string | null;
    attachments?: { id: Id<"_storage">; name: string; url: string | null }[] | null;
}

interface OtherUser {
    name?: string | null;
    image?: string | null;
    email?: string | null;
}

interface DmMessageListProps {
    messages: DirectMessage[];
    currentUserId: Id<"users"> | undefined;
    otherUser: OtherUser | null | undefined;
    loadMore: (count: number) => void;
    status: "LoadingFirstPage" | "LoadingMore" | "CanLoadMore" | "Exhausted";
}

export const DmMessageList = ({
    messages,
    currentUserId,
    otherUser,
    loadMore,
    status,
}: DmMessageListProps) => {
    // Group messages by date
    const groupedMessages = messages.reduce(
        (groups, message) => {
            const date = new Date(message._creationTime);
            const dateKey = format(date, "yyyy-MM-dd");
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].unshift(message);
            return groups;
        },
        {} as Record<string, DirectMessage[]>
    );

    return (
        <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
            {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                <div key={dateKey}>
                    {/* Date separator */}
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

                        const senderImage = isOtherUser ? otherUser?.image ?? undefined : undefined;
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
                                        <Thumbnail url={message.image} />
                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="mt-2 flex flex-col gap-1">
                                                {message.attachments.map((att) => (
                                                    <a
                                                        key={att.id}
                                                        href={att.url ?? "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline bg-blue-50 border border-blue-100 rounded px-2 py-1 w-fit"
                                                    >
                                                        📎 {att.name}
                                                    </a>
                                                ))}
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
                                    <AvatarFallback
                                        className={cn(
                                            "text-white text-sm font-medium rounded-md",
                                            isOtherUser ? "bg-sky-500" : "bg-primary"
                                        )}
                                    >
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
                                    <Thumbnail url={message.image} />
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="mt-2 flex flex-col gap-1">
                                            {message.attachments.map((att) => (
                                                <a
                                                    key={att.id}
                                                    href={`/api/storage/${att.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-xs text-blue-600 hover:underline bg-blue-50 border border-blue-100 rounded px-2 py-1 w-fit"
                                                >
                                                    📎 {att.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Load more trigger via IntersectionObserver */}
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

            {status === "LoadingMore" && (
                <div className="text-center my-2 relative">
                    <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
                    <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                        <Loader className="size-4 animate-spin" />
                    </span>
                </div>
            )}
        </div>
    );
};

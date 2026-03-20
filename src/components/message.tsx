import { format, isToday, isYesterday } from "date-fns";
import { Doc, Id } from "../../convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { Hint } from "./hint";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Thumbnail } from "./thumbnail";
import { Toolbar } from "./toolbar";
import { toast } from "sonner";
import { useUpdateMessage } from "@/features/messages/api/use-update-message";
import { cn } from "@/lib/utils";
import { useRemoveMessage } from "@/features/messages/api/use-remove-message";
import { useConfirm } from "@/hooks/use-confirm";
import { useToggleReaction } from "@/features/reactions/api/use-toggle-reaction";
import { Reactions } from "./reaction";
import { usePanel } from "@/hooks/use-panel";
import { ThreadBar } from "./thread-bar";
import { Paperclip, Download } from "lucide-react";

const Renderer = dynamic(() => import("@/components/renderer"), { ssr: false });
const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface MessageProps {
    id: Id<"messages">;
    memberId: Id<"members">;
    authorImage?: string;
    authorName?: string;
    isAuthor: boolean;
    reactions: Array<
        Omit<Doc<"reactions">, "memberId"> & {
            count: number;
            memberIds: Id<"members">[];
        }
    >;
    body: Doc<"messages">["body"];
    image: string | null | undefined;
    attachments?: Array<{ id: Id<"_storage">; name: string; url: string | null }> | undefined;
    createdAt: Doc<"messages">["_creationTime"];
    updatedAt: Doc<"messages">["updatedAt"];
    isEditing: boolean;
    isCompact?: boolean;
    setEditingId: (id: Id<"messages"> | null) => void;
    hideThreadButton?: boolean;
    threadCount?: number;
    threadImage?: string;
    threadName?: string;
    threadTimestamp?: number;
};

const formatFullTime = (date: Date) => {
    return `${isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yyyy")} at ${format(date, "h:mm a")}`;
};

// Attachments component to display file attachments
const Attachments = ({ attachments }: { attachments: Array<{ id: Id<"_storage">; name: string; url: string | null }> | undefined }) => {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="flex flex-col gap-1 mt-1">
            {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-slate-100 rounded-md max-w-fit">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{attachment.name}</span>
                    {attachment.url && (
                        <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <Download className="h-3 w-3" />
                            Download
                        </a>
                    )}
                </div>
            ))}
        </div>
    );
};

export const Message = ({
    id,
    isAuthor,
    memberId,
    authorImage,
    authorName = "Member",
    reactions,
    body,
    image,
    attachments,
    createdAt,
    updatedAt,
    isEditing,
    isCompact,
    setEditingId,
    hideThreadButton,
    threadCount,
    threadImage,
    threadName,
    threadTimestamp,
}: MessageProps) => {
    const { parentMessageId, onOpenMessage, onOpenProfile, onClose } = usePanel();
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete message",
        "Are you sure you want to delete this message? This cannot be undone."
    );

    const { mutate: updateMessage, isPending: isUpdatingMessage } = useUpdateMessage();
    const { mutate: removeMessage, isPending: isRemovingMessage } = useRemoveMessage();
    const { mutate: toggleReaction, isPending: isTogglingReaction } = useToggleReaction();

    const isPending = isUpdatingMessage || isTogglingReaction;

    const handleReaction = (value: string) => {
        toggleReaction({ messageId: id, value }, {
            onError: () => {
                toast.error("Failed to toggle reaction");
            },
        });
    };

    const handleRemove = async () => {
        const ok = await confirm();
        if (!ok) return;

        removeMessage({ id }, {
            onSuccess: () => {
                toast.success("Message deleted");
                if (parentMessageId === id) {
                    onClose();
                }
            },
            onError: () => {
                toast.error("Failed to delete message");
            },
        });
    };

    const handleUpdate = ({ body }: { body: string }) => {
        updateMessage({ id, body }, {
            onSuccess: () => {
                toast.success("Message updated");
                setEditingId(null);
            },
            onError: () => {
                toast.error("Failed to update message");
            }
        });
    };

    if (isCompact) {
        return (
            <>
                <ConfirmDialog />
                <div 
                    tabIndex={0} 
                    onClick={() => {}}
                    className={cn(
                        "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 focus-within:bg-gray-100/60 outline-none group relative",
                        isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433] focus-within:bg-[#f2c74433]",
                        isRemovingMessage && "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
                    )}
                >
                    <div className="flex items-start gap-2">
                        <Hint label={formatFullTime(new Date(createdAt))}>
                            <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 w-10 leading-5.5 text-center hover:underline">
                                {format(new Date(createdAt), "hh:mm")}
                            </button>
                        </Hint>
                        {isEditing ? (
                            <div className="w-full h-full">
                                <Editor
                                    onSubmit={handleUpdate}
                                    disabled={isPending}
                                    defaultValue={JSON.parse(body)}
                                    onCancel={() => setEditingId(null)}
                                    variant="update"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col w-full">
                                <Renderer value={body} />
                                <Thumbnail url={image} />
                                <Attachments attachments={attachments} />
                                {updatedAt ? (
                                    <span className="text-xs text-muted-foreground">
                                        (edited)
                                    </span>
                                ) : null}
                                <Reactions data={reactions} onChange={handleReaction} />
                                <ThreadBar
                                    count={threadCount}
                                    image={threadImage}
                                    name={threadName}
                                    timestamp={threadTimestamp}
                                    onClick={() => onOpenMessage(id)}
                                />
                            </div>
                        )}
                    </div>
                    {!isEditing && (
                        <Toolbar
                            isAuthor={isAuthor}
                            isPending={isPending}
                            handleEdit={() => setEditingId(id)}
                            handleThread={() => onOpenMessage(id)}
                            handleDelete={handleRemove}
                            handleReaction={handleReaction}
                            hideThreadButton={hideThreadButton}
                        />
                    )}
                </div>
            </>
        );
    }
    
    const avatarFallback = authorName.charAt(0).toUpperCase();

    return (
        <>
            <ConfirmDialog />
            <div 
                tabIndex={0} // ทำให้กล่องข้อความสามารถโฟกัสได้เมื่อถูกแตะ
                onClick={() => {}} // ทริคเล็กๆ เพื่อบังคับให้ iOS Safari รองรับการแตะ
                className={cn(
                    "flex flex-col gap-2 p-1.5 px-5 hover:bg-gray-100/60 focus-within:bg-gray-100/60 outline-none group relative", // เพิ่ม focus-within
                    isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433] focus-within:bg-[#f2c74433]",
                    isRemovingMessage && "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200"
                )}
            >
                <div className="flex items-start gap-2">
                    <button onClick={() => onOpenProfile(memberId)}>
                        <Avatar>
                            <AvatarImage src={authorImage} />
                            <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                    {isEditing ? (
                        <div className="w-full h-full">
                            <Editor
                                onSubmit={handleUpdate}
                                disabled={isPending}
                                defaultValue={JSON.parse(body)}
                                onCancel={() => setEditingId(null)}
                                variant="update"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col w-full overflow-hidden">
                            <div className="text-sm">
                                <button onClick={() => onOpenProfile(memberId)} className="font-bold text-primary hover:underline">
                                    {authorName}
                                </button>
                                <span>&nbsp;&nbsp;</span>
                                <Hint label={formatFullTime(new Date(createdAt))}>
                                    <button className="text-xs text-muted-foreground hover:underline">
                                        {format(new Date(createdAt), "h:mm a")}
                                    </button>
                                </Hint>
                            </div>
                            <Renderer value={body} />
                            <Thumbnail url={image} />
                            <Attachments attachments={attachments} />
                            {updatedAt ? (
                                <span className="text-xs text-muted-foreground">(edited)</span>
                            ) : null}
                            <Reactions data={reactions} onChange={handleReaction} />
                            <ThreadBar
                                count={threadCount}
                                image={threadImage}
                                name={threadName}
                                timestamp={threadTimestamp}
                                onClick={() => onOpenMessage(id)}
                            />
                        </div>
                    )}
                </div>
                {!isEditing && (
                    <Toolbar
                        isAuthor={isAuthor}
                        isPending={isPending}
                        handleEdit={() => setEditingId(id)}
                        handleThread={() => onOpenMessage(id)}
                        handleDelete={handleRemove}
                        handleReaction={handleReaction}
                        hideThreadButton={hideThreadButton}
                    />
                )}
            </div>
        </>
    );
};
"use client";

import { useState, useRef } from "react";
import { Calendar, User, Paperclip, Tag, MessageSquare, Activity, Copy, Trash2, X, Check, Plus } from "lucide-react";
import { format } from "date-fns";
import { useGetTaskCardById } from "../api/use-get-cards";
import { useGetTaskComments } from "../api/use-get-comments";
import { useGetTaskActivityLogs } from "../api/use-get-activity-logs";
import { useCreateTaskComment } from "../api/use-create-comment";
import { useUpdateTaskCard } from "../api/use-update-card";
import { useRemoveTaskCard } from "../api/use-remove-card";
import { useCopyTaskCard } from "../api/use-copy-card";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Id } from "../../../../convex/_generated/dataModel";
import { useConfirm } from "@/hooks/use-confirm";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface TaskCardDetailProps {
    cardId: Id<"taskCards">;
    onClose: () => void;
}

export const TaskCardDetail = ({ cardId, onClose }: TaskCardDetailProps) => {
    const card = useGetTaskCardById(cardId);
    const comments = useGetTaskComments(cardId);
    const activityLogs = useGetTaskActivityLogs(cardId);
    
    const { mutate: createComment, isPending: isCreatingComment } = useCreateTaskComment();
    const { mutate: updateCard, isPending: isUpdatingCard } = useUpdateTaskCard();
    const { mutate: removeCard, isPending: isRemovingCard } = useRemoveTaskCard();
    const { mutate: copyCard, isPending: isCopyingCard } = useCopyTaskCard();
    const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
    const workspaceId = useWorkspaceId();
    const { data: members } = useGetMembers({ workspaceId });

    const [ConfirmDialog, confirm] = useConfirm(
        "Delete Card",
        "Are you sure you want to delete this card? This action cannot be undone."
    );

    const [newComment, setNewComment] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState(card?.description || "");
    
    const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
    const [labelPopoverOpen, setLabelPopoverOpen] = useState(false);
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    const [attachmentPopoverOpen, setAttachmentPopoverOpen] = useState(false);
    
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        await createComment({
            taskId: cardId,
            content: newComment,
        }, {
            onSuccess: () => setNewComment(""),
        });
    };

    const handleUpdateDescription = async () => {
        await updateCard({
            cardId,
            description,
        });
        setIsEditingDescription(false);
    };

    const handleCopyCard = async () => {
        if (!card) return;
        await copyCard({
            cardId,
            listId: card.listId,
        }, {
            onSuccess: () => {
                toast.success("Card copied successfully");
                onClose();
            },
            onError: () => {
                toast.error("Failed to copy card");
            },
        });
    };

    const handleDeleteCard = async () => {
        const ok = await confirm();
        if (!ok) return;

        await removeCard({ cardId }, {
            onSuccess: () => {
                toast.success("Card deleted successfully");
                onClose();
            },
            onError: () => {
                toast.error("Failed to delete card");
            },
        });
    };

    const LABEL_COLORS = [
        { name: "Red", value: "#ef4444" },
        { name: "Orange", value: "#f97316" },
        { name: "Yellow", value: "#eab308" },
        { name: "Green", value: "#22c55e" },
        { name: "Blue", value: "#3b82f6" },
        { name: "Purple", value: "#a855f7" },
        { name: "Pink", value: "#ec4899" },
        { name: "Gray", value: "#6b7280" },
    ];

    const handleAssignMember = async (memberId: Id<"members"> | "__CLEAR__") => {
        await updateCard({
            cardId,
            assigneeId: memberId,
        }, {
            onSuccess: () => {
                toast.success(memberId !== "__CLEAR__" ? "Member assigned" : "Member removed");
                setMemberPopoverOpen(false);
            },
            onError: () => toast.error("Failed to update assignee"),
        });
    };

    const handleSetDueDate = async (date: string) => {
        const dueDate = date ? new Date(date).getTime() : "__CLEAR__";
        await updateCard({
            cardId,
            dueDate,
        }, {
            onSuccess: () => {
                toast.success(date ? "Due date set" : "Due date removed");
                setDatePopoverOpen(false);
            },
            onError: () => toast.error("Failed to set due date"),
        });
    };

    const handleToggleLabel = async (color: string) => {
        const currentLabels = card?.labels || [];
        const newLabels = currentLabels.includes(color)
            ? currentLabels.filter(l => l !== color)
            : [...currentLabels, color];
        
        await updateCard({
            cardId,
            labels: newLabels,
        }, {
            onSuccess: () => toast.success("Labels updated"),
            onError: () => toast.error("Failed to update labels"),
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("File size exceeds 5MB limit");
            return;
        }

        setIsUploading(true);
        try {
            const uploadUrl = await generateUploadUrl();
            
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type || "application/octet-stream" },
                body: file,
            });
            
            if (!result.ok) {
                const errorText = await result.text();
                console.error("Upload failed:", result.status, errorText);
                throw new Error(`Upload failed: ${result.status} ${errorText}`);
            }
            
            const response = await result.json();
            const storageId = response.storageId || response.id;
            
            if (!storageId) {
                throw new Error("No storageId received from upload");
            }
            
            const currentAttachments = card?.attachments || [];
            await updateCard({
                cardId,
                attachments: [...currentAttachments, storageId],
            }, {
                onSuccess: () => {
                    toast.success("File uploaded successfully");
                    setAttachmentPopoverOpen(false);
                },
                onError: () => toast.error("Failed to add attachment"),
            });
        } catch (err) {
            console.error("Upload error:", err);
            toast.error(err instanceof Error ? err.message : "Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemoveAttachment = async (storageId: Id<"_storage">) => {
        const currentAttachments = card?.attachments || [];
        await updateCard({
            cardId,
            attachments: currentAttachments.filter(id => id !== storageId),
        }, {
            onSuccess: () => toast.success("Attachment removed"),
            onError: () => toast.error("Failed to remove attachment"),
        });
    };

    const getStorageUrl = (storageId: Id<"_storage">) => {
        return `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;
    };

    if (!card) return null;

    return (
        <>
            <ConfirmDialog />
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">{card.title}</h2>
                        <p className="text-sm text-muted-foreground">
                            in list <span className="font-medium">{card.list?.name}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex flex-wrap gap-4">
                            {card.assignee && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Assignee</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={card.assignee.image} />
                                            <AvatarFallback className="rounded-md bg-sky-500 text-sm text-white">{card.assignee.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{card.assignee.name}</span>
                                    </div>
                                </div>
                            )}

                            {card.dueDate && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Due Date</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-sm">{format(card.dueDate, "PPP")}</span>
                                    </div>
                                </div>
                            )}

                            {card.labels && card.labels.length > 0 && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Labels</label>
                                    <div className="flex gap-1 mt-1">
                                        {card.labels.map((label, i) => (
                                            <Badge key={i} style={{ backgroundColor: label }}>
                                                <Tag className="h-3 w-3 mr-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Description</h3>
                            {isEditingDescription ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a description..."
                                        rows={4}
                                        disabled={isUpdatingCard}
                                    />
                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            onClick={handleUpdateDescription} 
                                            disabled={!description.trim() || isUpdatingCard} 
                                            className="bg-[#337f37] hover:bg-[#2a6b2e] h-8 text-xs"
                                        >
                                            {isUpdatingCard ? "Saving..." : "Save"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setDescription(card.description || "");
                                                setIsEditingDescription(false);
                                            }}
                                            disabled={isUpdatingCard}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setIsEditingDescription(true)}
                                    className="p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 min-h-[60px] text-sm whitespace-pre-wrap"
                                >
                                    {card.description || <span className="text-muted-foreground">Add a description...</span>}
                                </div>
                            )}
                        </div>

                        {card.attachments && card.attachments.length > 0 && (
                            <div>
                                <h3 className="font-medium mb-2 flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Attachments ({card.attachments.length})
                                </h3>
                                <div>
    <h3 className="font-medium mb-2 flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments ({card.attachments.length})
    </h3>
    <div className="space-y-2">
        {card.attachments.map((attachment, i) => {
            // ดึงชื่อไฟล์ออกมา ถ้ามี .name ก็ใช้เลย ถ้าไม่มีจะดึงเอา ID 5 ตัวหลังมาทำเป็นชื่อไฟล์ชั่วคราวแทน
            const fileName = `File_${attachment.toString().slice(-5)}`;

            return (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded group">
                    {/* ใส่ shrink-0 ป้องกันไอคอนเบี้ยวถ้าชื่อไฟล์ยาว */}
                    <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a 
                        // ถ้า attachment เป็น Object ต้องใช้ .id (หรือฟิลด์ที่คุณเก็บ id) ส่งเข้าไป
                        href={getStorageUrl(attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        // เพิ่ม truncate เพื่อตัดคำ (...) ถ้าชื่อไฟล์ยาวเกินไป และซ่อน title ไว้ให้ดูตอนเอาเมาส์ชี้
                        className="text-sm flex-1 hover:underline text-blue-600 truncate"
                        title={fileName} 
                    >
                        {fileName}
                    </a>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleRemoveAttachment(attachment)}
                        disabled={isUpdatingCard}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )
        })}
    </div>
</div>
                            </div>
                        )}

                        <Tabs defaultValue="comments">
                            <TabsList>
                                <TabsTrigger value="comments" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Comments
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Activity
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="comments" className="space-y-4 mt-4">
                                <form onSubmit={handleAddComment} className="flex gap-2">
                                    <Input
                                        placeholder="Write a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        disabled={isCreatingComment}
                                    />
                                    <Button 
                                        type="submit" 
                                        disabled={isCreatingComment || !newComment.trim()} 
                                        className="bg-[#337f37] hover:bg-[#2a6b2e] text-xs align-middle"
                                    >
                                        Post
                                    </Button>
                                </form>

                                <div className="space-y-4 mt-6">
                                    {comments?.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                                    )}
                                    {comments?.map((comment) => (
                                        <div key={comment._id} className="flex gap-3">
                                            <Avatar className="h-8 w-8 mt-1">
                                                <AvatarImage src={comment.user?.image} />
                                                <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                                                    {comment.user?.name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 bg-muted/50 p-3 rounded-md">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">{comment.user?.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(comment._creationTime, "PPp")}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="activity" className="space-y-4 mt-4">
                                {activityLogs?.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
                                )}
                                {activityLogs?.map((log) => (
                                    <div key={log._id} className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={log.user?.image} />
                                            <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                                                {log.user?.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{log.user?.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(log._creationTime, "PPp")}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">
                                                {log.action === "moved" && log.fromList && log.toList
                                                    ? `moved this card from "${log.fromList.name}" to "${log.toList.name}"`
                                                    : log.details}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Add to card</h4>
                            <div className="space-y-2">
                                <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start" size="sm">
                                            <User className="h-4 w-4 mr-2" />
                                            Members
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2" align="start">
                                        <div className="text-sm font-medium mb-2">Assign Member</div>
                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                            {card.assignee && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-muted-foreground"
                                                    onClick={() => handleAssignMember("__CLEAR__")}
                                                >
                                                    <X className="h-4 w-4 mr-2" />
                                                    Remove assignee
                                                </Button>
                                            )}
                                            <Separator className="my-1" />
                                            {members?.map((member) => (
                                                <Button
                                                    key={member._id}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() => handleAssignMember(member._id)}
                                                >
                                                    <Avatar className="h-5 w-5 mr-2">
                                                        <AvatarImage src={member.user.image} />
                                                        <AvatarFallback className="text-[10px] text-white bg-sky-500 rounded-md">
                                                            {member.user.name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="flex-1 text-left">{member.user.name}</span>
                                                    {card.assignee?._id === member.user._id && (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Popover open={labelPopoverOpen} onOpenChange={setLabelPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start" size="sm">
                                            <Tag className="h-4 w-4 mr-2" />
                                            Labels
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                        <div className="text-sm font-medium mb-2">Select Labels</div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {LABEL_COLORS.map((color) => {
                                                const isSelected = card.labels?.includes(color.value);
                                                return (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => handleToggleLabel(color.value)}
                                                        className={`w-10 h-10 rounded-md transition-all ${
                                                            isSelected ? "ring-2 ring-offset-2 ring-black scale-110" : "hover:scale-105"
                                                        }`}
                                                        style={{ backgroundColor: color.value }}
                                                        title={color.name}
                                                    >
                                                        {isSelected && <Check className="h-4 w-4 mx-auto text-white" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {card.labels && card.labels.length > 0 && (
                                            <>
                                                <Separator className="my-2" />
                                                <div className="flex gap-1 flex-wrap">
                                                    {card.labels.map((label, i) => (
                                                        <Badge 
                                                            key={i} 
                                                            style={{ backgroundColor: label }}
                                                            className="text-white"
                                                        >
                                                            {LABEL_COLORS.find(c => c.value === label)?.name || "Custom"}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </PopoverContent>
                                </Popover>

                                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start" size="sm">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Dates
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                        <div className="text-sm font-medium mb-2">Due Date</div>
                                        <Input
                                            type="date"
                                            value={card.dueDate ? format(card.dueDate, "yyyy-MM-dd") : ""}
                                            onChange={(e) => handleSetDueDate(e.target.value)}
                                            className="mb-2"
                                        />
                                        {card.dueDate && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-muted-foreground"
                                                onClick={() => handleSetDueDate("")}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Remove due date
                                            </Button>
                                        )}
                                    </PopoverContent>
                                </Popover>

                                <Popover open={attachmentPopoverOpen} onOpenChange={setAttachmentPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start" size="sm">
                                            <Paperclip className="h-4 w-4 mr-2" />
                                            Attachment
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-3" align="start">
                                        <div className="text-sm font-medium mb-2">Add Attachment</div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            {isUploading ? (
                                                <>Uploading...</>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Choose file
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Max file size: 5MB
                                        </p>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium mb-2">Actions</h4>
                            <div className="space-y-2">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start" 
                                    size="sm"
                                    onClick={handleCopyCard}
                                    disabled={isCopyingCard}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    {isCopyingCard ? "Copying..." : "Copy"}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                                    size="sm"
                                    onClick={handleDeleteCard}
                                    disabled={isRemovingCard}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {isRemovingCard ? "Deleting..." : "Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

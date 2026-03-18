"use client";

import { useState, useRef } from "react";
import { Calendar, User, Paperclip, Tag, MessageSquare, Activity, Copy, Trash2, X, Check, Plus, Image as ImageIcon, File as FileIcon, Download } from "lucide-react";
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
    { name: "Red", value: "#e11d48" },      // Rose 600: แดงอมชมพู ดูแพงและสบายตากว่าแดงสด
    { name: "Orange", value: "#ea580c" },   // Orange 600: ส้มอิฐ ไม่แยงตา
    { name: "Yellow", value: "#eab308" },   // Yellow 500: เหลืองมัสตาร์ด (อันเดิมนี้สวยอยู่แล้วครับ)
    { name: "Theme Green", value: "#337f37" }, // Primary: สีเขียวหลักของแอป CT Workspace! 🟢
    { name: "Blue", value: "#0ea5e9" },     // Sky 500: สีฟ้าโทนเดียวกับ Avatar ที่เราตั้งค่าไว้
    { name: "Purple", value: "#8b5cf6" },   // Violet 500: ม่วงตุ่นๆ เข้ากับพื้นหลัง Slate ได้ดี
    { name: "Pink", value: "#f43f5e" },     // Rose 500: ชมพูซอฟต์ๆ
    { name: "Slate", value: "#64748b" },    // Slate 500: เทาอมฟ้า เข้ากับโทนสีหน้าต่าง Modal ของเรา
];

    const isLightColor = (color: string): boolean => {
        const hex = color.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 180;
    };

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
            
            const currentAttachments = card?.attachments?.map(a => a.storageId) || [];
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
        const currentAttachments = card?.attachments?.map(a => a.storageId) || [];
        await updateCard({
            cardId,
            attachments: currentAttachments.filter(id => id !== storageId),
        }, {
            onSuccess: () => toast.success("Attachment removed"),
            onError: () => toast.error("Failed to remove attachment"),
        });
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
                        <div className="flex flex-wrap gap-6">
                            {card.assignee && (
                                <div className="group">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5" />
                                        Assignee
                                    </label>
                                    <div className="flex items-center gap-2.5 px-3 py-2 bg-linear-to-br from-sky-50 to-white border border-sky-100 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                                        <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                            <AvatarImage src={card.assignee.image} />
                                            <AvatarFallback className="rounded-full bg-linear-to-br from-sky-500 to-blue-600 text-sm text-white font-medium">
                                                {card.assignee.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">{card.assignee.name}</span>
                                            <p className="text-xs text-muted-foreground">Assigned to this card</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {card.dueDate && (
                                <div className="group">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Due Date
                                    </label>
                                    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl shadow-sm border transition-all duration-200 ${
                                        card.dueDate < Date.now() 
                                            ? 'bg-linear-to-br from-red-50 to-white border-red-100' 
                                            : 'bg-linear-to-br from-amber-50 to-white border-amber-100'
                                    }`}>
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-sm ${
                                            card.dueDate < Date.now() 
                                                ? 'bg-linear-to-br from-red-500 to-red-600' 
                                                : 'bg-linear-to-br from-amber-400 to-amber-500'
                                        }`}>
                                            <span className="text-white text-xs font-bold text-center leading-tight">
                                                {format(card.dueDate, "MMM")}<br/>{format(card.dueDate, "d")}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${
                                                card.dueDate < Date.now() ? 'text-red-600' : 'text-slate-700'
                                            }`}>
                                                {format(card.dueDate, "PPP")}
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                {card.dueDate < Date.now() ? 'Overdue' : format(card.dueDate, "h:mm a")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {card.labels && card.labels.length > 0 && (
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5" />
                                        Labels
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {card.labels.map((label) => {
                                            const labelName = LABEL_COLORS.find(c => c.value === label)?.name || "Custom";
                                            return (
                                                <Badge 
                                                    key={label} 
                                                    style={{ 
                                                        backgroundColor: label,
                                                        color: isLightColor(label) ? '#1e293b' : '#ffffff'
                                                    }}
                                                    className="px-3 py-1.5 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 cursor-default border-0"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                                        {labelName}
                                                    </span>
                                                </Badge>
                                            );
                                        })}
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
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                                    <div className="h-7 w-7 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                                        <Paperclip className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    Attachments
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {card.attachments.length}
                                    </Badge>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {card.attachments?.map((attachment) => {
                                        const fileId = attachment.storageId.toString();
                                        const fileName = `File_${fileId.slice(0, 8)}...${fileId.slice(-4)}`;
                                        const fileExt = "FILE";
                                        const isImage = false;

                                        return (
                                            <div 
                                                key={attachment.storageId} 
                                                className="group relative flex items-center gap-2 px-2.5 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow hover:border-violet-200 transition-all duration-200"
                                            >
                                                <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
                                                    isImage 
                                                        ? 'bg-linear-to-br from-violet-100 to-fuchsia-100' 
                                                        : 'bg-linear-to-br from-slate-100 to-gray-100'
                                                }`}>
                                                    {isImage ? (
                                                        <ImageIcon className="h-4 w-4 text-violet-500" />
                                                    ) : (
                                                        <FileIcon className="h-4 w-4 text-slate-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-700 truncate leading-tight">
                                                        {fileName}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                                        {fileExt}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    {attachment.url && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                                            asChild
                                                        >
                                                            <a 
                                                                href={attachment.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title="Download"
                                                            >
                                                                <Download className="h-3.5 w-3.5" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={() => handleRemoveAttachment(attachment.storageId)}
                                                        disabled={isUpdatingCard}
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
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
                                        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
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
                                                    {card.labels.map((label) => (
                                                        <Badge 
                                                            key={label} 
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

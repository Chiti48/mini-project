"use client";

import { useState } from "react";
import { X, Calendar, User, Paperclip, Tag, MessageSquare, Activity } from "lucide-react";
import { format } from "date-fns";
import { useGetTaskCardById } from "../api/use-get-cards";
import { useGetTaskComments } from "../api/use-get-comments";
import { useGetTaskActivityLogs } from "../api/use-get-activity-logs";
import { useCreateTaskComment } from "../api/use-create-comment";
import { useUpdateTaskCard } from "../api/use-update-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Id } from "../../../../convex/_generated/dataModel";

interface TaskCardDetailProps {
    cardId: Id<"taskCards">;
    onClose: () => void;
}

export const TaskCardDetail = ({ cardId, onClose }: TaskCardDetailProps) => {
    const card = useGetTaskCardById(cardId);
    const comments = useGetTaskComments(cardId);
    const activityLogs = useGetTaskActivityLogs(cardId);
    const { mutate: createComment, isPending: isCreatingComment } = useCreateTaskComment();
    const { mutate: updateCard } = useUpdateTaskCard();

    const [newComment, setNewComment] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState(card?.description || "");

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

    if (!card) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold">{card.title}</h2>
                    <p className="text-sm text-muted-foreground">
                        in list <span className="font-medium">{card.list?.name}</span>
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4">
                        {card.assignee && (
                            <div>
                                <label className="text-xs text-muted-foreground">Assignee</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={card.assignee.image} />
                                        <AvatarFallback>{card.assignee.name?.charAt(0)}</AvatarFallback>
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

                    {/* Description */}
                    <div>
                        <h3 className="font-medium mb-2">Description</h3>
                        {isEditingDescription ? (
                            <div className="space-y-2">
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add a description..."
                                    rows={4}
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleUpdateDescription}>
                                        Save
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setDescription(card.description || "");
                                            setIsEditingDescription(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingDescription(true)}
                                className="p-3 bg-muted rounded-md cursor-pointer hover:bg-muted/80 min-h-[60px]"
                            >
                                {card.description || "Add a description..."}
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    {card.attachments && card.attachments.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2 flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Attachments
                            </h3>
                            <div className="space-y-2">
                                {card.attachments.map((attachment, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                                        <Paperclip className="h-4 w-4" />
                                        <span className="text-sm">Attachment {i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs for Comments and Activity */}
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

                        <TabsContent value="comments" className="space-y-4">
                            {/* Add Comment */}
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <Input
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button type="submit" disabled={isCreatingComment}>
                                    Post
                                </Button>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-4">
                                {comments?.map((comment) => (
                                    <div key={comment._id} className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={comment.user?.image} />
                                            <AvatarFallback>
                                                {comment.user?.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {comment.user?.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(comment._creationTime, "PPp")}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-4">
                            {activityLogs?.map((log) => (
                                <div key={log._id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={log.user?.image} />
                                        <AvatarFallback>
                                            {log.user?.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                                {log.user?.name}
                                            </span>
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

                {/* Sidebar */}
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium mb-2">Add to card</h4>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <User className="h-4 w-4 mr-2" />
                                Members
                            </Button>
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <Tag className="h-4 w-4 mr-2" />
                                Labels
                            </Button>
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Dates
                            </Button>
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <Paperclip className="h-4 w-4 mr-2" />
                                Attachment
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

"use client";

import { useState } from "react";
import { Plus, Calendar, Paperclip, Tag } from "lucide-react";
import { format } from "date-fns";
import { Draggable, Droppable, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd";
import { useGetTaskCards } from "../api/use-get-cards";
import { useCreateTaskCard } from "../api/use-create-card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // 1. นำเข้า Avatar 
import { Id } from "../../../../convex/_generated/dataModel";
import { TaskCardDetail } from "./task-card-detail";
import { cn } from "@/lib/utils";

interface TaskListProps {
    listId: Id<"taskLists">;
}

interface TaskCardItemProps {
    card: {
        _id: Id<"taskCards">;
        title: string;
        description?: string;
        assignee?: {
            name?: string;
            image?: string;
        } | null;
        dueDate?: number;
        labels?: string[];
        attachments?: Id<"_storage">[];
    };
    index: number;
}

const TaskCardItem = ({ card, index }: TaskCardItemProps) => {
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    return (
        <>
            <Draggable draggableId={card._id} index={index}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => setIsDetailOpen(true)}
                        // เพิ่ม user-select-none ป้องกันการคลุมดำตัวอักษรตอนลาก
                        className="select-none" 
                    >
                        <Card
                            className={cn(
                                "cursor-pointer hover:shadow-md transition-all border-0 shadow-sm group",
                                // เอฟเฟกต์ตอนกำลังลากการ์ด
                                snapshot.isDragging ? "shadow-xl rotate-2 ring-2 ring-[#337f37] opacity-90" : ""
                            )}
                        >
                            <CardContent className="p-3">
                                {/* Labels */}
                                {card.labels && card.labels.length > 0 && (
                                    <div className="flex gap-1 flex-wrap mb-2">
                                        {card.labels.map((label, i) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="text-[10px] px-1.5 h-4"
                                                style={{ backgroundColor: label }}
                                            >
                                                <Tag className="h-2.5 w-2.5 mr-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Title */}
                                <h4 className="font-medium text-sm mb-3 text-gray-800 leading-tight">
                                    {card.title}
                                </h4>

                                {/* Meta info */}
                                <div className="flex items-end justify-between mt-auto">
                                    <div className="flex items-center gap-3">
                                        {/* Due date */}
                                        {card.dueDate && (
                                            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded-sm">
                                                <Calendar className="h-3 w-3" />
                                                {format(card.dueDate, "MMM d")}
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {card.attachments && card.attachments.length > 0 && (
                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Paperclip className="h-3 w-3" />
                                                {card.attachments.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Assignee - เปลี่ยนมาใช้ Avatar */}
                                    {card.assignee && (
                                        <Avatar className="h-6 w-6 ring-2 ring-white">
                                            <AvatarImage src={card.assignee.image} />
                                            <AvatarFallback className="bg-[#337f37] text-white text-[10px] font-medium">
                                                {card.assignee.name?.charAt(0)?.toUpperCase() || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </Draggable>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogDescription className="sr-only">
                        Card Details
                    </DialogDescription>
                    <DialogTitle className="sr-only">Card Details</DialogTitle>
                    <TaskCardDetail
                        cardId={card._id}
                        onClose={() => setIsDetailOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

export const TaskList = ({ listId }: TaskListProps) => {
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState("");

    const cards = useGetTaskCards(listId);
    const { mutate: createCard, isPending } = useCreateTaskCard();

    const handleCreateCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCardTitle.trim()) return;

        await createCard({
            listId,
            title: newCardTitle,
        }, {
            onSuccess: () => {
                toast.success("Card created successfully");
                setNewCardTitle("");
                setIsAddingCard(false);
            },
            onError: () => {
                toast.error("Failed to create card");
            },
        });
    };

    return (
        // 2. ปรับความสูงของ List ให้ยืดหยุ่นและเลื่อน (Scroll) เฉพาะเนื้อหาด้านใน
        <div className="flex flex-col max-h-full">
            <Droppable droppableId={listId}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        // 3. ใช้ flex-col และ gap-y-2 แทน mb-2 ที่การ์ด + ให้ Scroll ได้
                        className={cn(
                            "flex-1 overflow-y-auto overflow-x-hidden min-h-[10px] px-2 pb-2 flex flex-col gap-y-2",
                            "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent", // ถ้าคุณมี tailwind-scrollbar plugin
                            snapshot.isDraggingOver ? "bg-black/5 rounded-lg" : ""
                        )}
                    >
                        {cards?.map((card, cardIndex) => (
                            <TaskCardItem
                                key={card._id}
                                card={card}
                                index={cardIndex}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            {/* Add Card Form */}
            <div className="px-2 pb-2 pt-2 mt-auto">
                {isAddingCard ? (
                    <form onSubmit={handleCreateCard}>
                        <Input
                            placeholder="Enter card title..."
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            className="mb-2 bg-white text-sm shadow-sm"
                            disabled={isPending}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isPending || !newCardTitle.trim()}
                                className="bg-[#337f37] hover:bg-[#2a6b2e] h-8 text-xs"
                            >
                                Add Card
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                onClick={() => setIsAddingCard(false)}
                                className="h-8 text-xs hover:bg-black/5"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-black/5 h-8 text-xs"
                        onClick={() => setIsAddingCard(true)}
                    >
                        <Plus className="h-3 w-3 mr-2" />
                        Add a card
                    </Button>
                )}
            </div>
        </div>
    );
};
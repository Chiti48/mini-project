"use client";

import { useState } from "react";
import { Plus, Calendar, Paperclip, Tag } from "lucide-react";
import { format } from "date-fns";
import { Draggable, Droppable, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd";
import Image from "next/image";
import { useGetTaskCards } from "../api/use-get-cards";
import { useCreateTaskCard } from "../api/use-create-card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Id } from "../../../../convex/_generated/dataModel";
import { TaskCardDetail } from "./task-card-detail";

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
                    >
                        <Card
                            className={`mb-2 cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm ${
                                snapshot.isDragging ? "shadow-xl rotate-2 ring-2 ring-[#337f37]" : ""
                            }`}
                        >
                            <CardContent className="p-3">
                                {/* Labels */}
                                {card.labels && card.labels.length > 0 && (
                                    <div className="flex gap-1 flex-wrap mb-2">
                                        {card.labels.map((label, i) => (
                                            <Badge
                                                key={i}
                                                variant="secondary"
                                                className="text-xs"
                                                style={{
                                                    backgroundColor: label,
                                                }}
                                            >
                                                <Tag className="h-3 w-3 mr-1" />
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Title */}
                                <h4 className="font-medium text-sm mb-2">{card.title}</h4>

                                {/* Meta info */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {/* Due date */}
                                        {card.dueDate && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {format(card.dueDate, "MMM d")}
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {card.attachments && card.attachments.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Paperclip className="h-3 w-3" />
                                                {card.attachments.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Assignee */}
                                    {card.assignee && (
                                        <div className="flex items-center gap-1">
                                            {card.assignee.image ? (
                                                <Image
                                                    src={card.assignee.image}
                                                    alt={card.assignee.name || ""}
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full ring-2 ring-white"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-[#337f37] text-white flex items-center justify-center text-xs font-medium">
                                                    {card.assignee.name?.charAt(0) || "?"}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </Draggable>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
        <div className="flex flex-col">
            <Droppable droppableId={listId}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[100px] ${
                            snapshot.isDraggingOver ? "bg-white/40 rounded-lg" : ""
                        }`}
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
            <div className="p-2 pt-0">
                {isAddingCard ? (
                    <form onSubmit={handleCreateCard}>
                        <Input
                            placeholder="Enter card title..."
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            className="mb-2 bg-white text-sm"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isPending || !newCardTitle.trim()}
                                className="bg-[#337f37] hover:bg-[#2a6b2e] h-8 text-xs"
                                variant="default"
                            >
                                Add Card
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddingCard(false)}
                                className="h-8 text-xs"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-white/50 h-8 text-xs"
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

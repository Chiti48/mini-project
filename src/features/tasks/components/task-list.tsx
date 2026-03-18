"use client";

import { useState } from "react";
import { Plus, Calendar, Paperclip } from "lucide-react";
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
            // เพิ่ม padding เล็กน้อยกันขอบการ์ดแหว่งตอนมีเงา
            className="select-none py-0.5" 
        >
            <Card
                className={cn(
                    // 1. เปลี่ยน Cursor เป็นรูปมือจับ (Grab) ให้รู้ว่าลากได้
                    "group cursor-grab active:cursor-grabbing bg-white border border-slate-200 transition-all duration-200",
                    // 2. เอฟเฟกต์ตอนชี้เมาส์ (Hover) จะยกลอยขึ้นนิดนึง
                    "hover:shadow-md hover:border-slate-300 hover:-translate-y-px",
                    // 3. เอฟเฟกต์ตอนกำลังลาก (Dragging) มีการขยายขนาด (scale) และเอียงนิดๆ
                    snapshot.isDragging 
                        ? "shadow-xl rotate-2 scale-[1.02] ring-1 ring-[#337f37]/40 z-50" 
                        : "shadow-sm"
                )}
            >
                {/* เพิ่ม gap ภายในให้ดูโปร่ง ไม่อึดอัด */}
                <CardContent className="p-3 flex flex-col gap-2.5">
                    
                    {/* Labels: ปรับให้เป็นแถบสีมินิมอล (สไตล์ Trello ยุคใหม่) ลดความรกของไอคอน */}
                    {card.labels && card.labels.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                            {card.labels.map((label, i) => (
                                <div
                                    key={i}
                                    className="h-1.5 w-8 rounded-full transition-all group-hover:opacity-80"
                                    style={{ backgroundColor: label }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Title: เพิ่ม line-clamp ป้องกันชื่อยาวเกินไปจนการ์ดพัง */}
                    <h4 className="font-medium text-sm text-slate-700 leading-snug line-clamp-3">
                        {card.title}
                    </h4>

                    {/* Meta info & Assignee */}
                    <div className="flex items-end justify-between mt-1">
                        <div className="flex items-center gap-3 text-slate-500">
                            
                            {/* Due date: ปรับให้เป็น Badge ดูนุ่มนวลขึ้น */}
                            {card.dueDate && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium bg-slate-100/80 px-2 py-1 rounded-md">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    <span>{format(card.dueDate, "MMM d")}</span>
                                </div>
                            )}

                            {/* Attachments: เอาพื้นหลังออก ให้กลืนไปกับตัวการ์ด แต่ยังดูชัดเจน */}
                            {card.attachments && card.attachments.length > 0 && (
                                <div className="flex items-center gap-1 text-[11px] font-medium px-1">
                                    <Paperclip className="h-3 w-3 text-slate-400" />
                                    <span>{card.attachments.length}</span>
                                </div>
                            )}
                        </div>

                        {/* Assignee: เพิ่ม Gradient สวยๆ และลูกเล่นเด้งตอน Hover */}
                        {card.assignee && (
                            <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                                <AvatarImage src={card.assignee.image} />
                                <AvatarFallback className="bg-linear-to-br from-[#337f37] to-[#2a6b2e] text-white text-[10px] font-medium">
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide">
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
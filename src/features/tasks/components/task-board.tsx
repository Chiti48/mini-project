"use client";

import { useState, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { useGetTaskLists } from "../api/use-get-lists";
import { useCreateTaskList } from "../api/use-create-list";
import { useMoveTaskCard } from "../api/use-move-card";
import { useRemoveTaskList } from "../api/use-remove-list";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskList } from "./task-list";
import { Id } from "../../../../convex/_generated/dataModel";
import { useConfirm } from "@/hooks/use-confirm"; // 1. นำเข้า useConfirm

interface TaskBoardProps {
    boardId: Id<"taskBoards">;
}

export const TaskBoard = ({ boardId }: TaskBoardProps) => {
    const lists = useGetTaskLists(boardId);
    const { mutate: moveCard } = useMoveTaskCard();
    const { mutate: createList, isPending } = useCreateTaskList();
    const { mutate: removeList } = useRemoveTaskList();

    // 2. เรียกใช้งาน Confirm Dialog
    const [ConfirmDialog, confirm] = useConfirm(
        "Delete List",
        "Are you sure you want to delete this list? All tasks inside will be permanently deleted and cannot be undone."
    );

    const [isAddingList, setIsAddingList] = useState(false);
    const [newListName, setNewListName] = useState("");

    const onDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) return;

        const { draggableId, source, destination } = result;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        moveCard({
            cardId: draggableId as Id<"taskCards">,
            toListId: destination.droppableId as Id<"taskLists">,
            newOrder: destination.index,
        });
    }, [moveCard]);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        const maxOrder = lists && lists.length > 0
            ? Math.max(...lists.map(l => l.order))
            : -1;

        await createList({
            boardId,
            name: newListName,
            order: maxOrder + 1,
        }, {
            onSuccess: () => {
                toast.success("List created successfully");
                setNewListName("");
                setIsAddingList(false);
            },
            onError: () => {
                toast.error("Failed to create list");
            },
        });
    };

    // 3. ปรับฟังก์ชันให้รอการยืนยันก่อนลบ
    const handleDeleteList = async (listId: Id<"taskLists">) => {
        const ok = await confirm();
        
        if (!ok) return; // ถ้ายกเลิก ก็หยุดการทำงาน

        removeList({ listId }, {
            onSuccess: () => {
                toast.success("List deleted successfully");
            },
            onError: () => {
                toast.error("Failed to delete list");
            },
        });
    };

    return (
        <>
            <ConfirmDialog /> {/* 4. วาง Dialog ไว้ด้านบนสุด */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto p-4 min-h-[calc(100vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {lists?.map((list) => (
                        <div key={list._id} className="w-72 shrink-0">
                            <div className="bg-white/60 rounded-lg shadow-sm">
                                <div className="p-3 pb-2 flex flex-row items-center justify-between">
                                    <h3 className="font-semibold text-sm text-gray-800">{list.name}</h3>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteList(list._id)}
                                                className="text-red-600 focus:bg-red-50 focus:text-red-700" // เพิ่มสีตอน Hover ให้ชัดเจนว่าเป็นปุ่มอันตราย
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete List
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <TaskList listId={list._id} />
                            </div>
                        </div>
                    ))}

                    {/* Add List */}
                    <div className="w-72 shrink-0">
                        {isAddingList ? (
                            <form onSubmit={handleCreateList} className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                                <Input
                                    placeholder="Enter list title..."
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    className="mb-2"
                                    autoFocus
                                    disabled={isPending} // ล็อค Input ตอนกำลังโหลด
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isPending || !newListName.trim()}
                                        className="bg-[#337f37] hover:bg-[#2a6b2e] text-white"
                                    >
                                        Add List
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsAddingList(false)}
                                        disabled={isPending}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <Button
                                variant="ghost"
                                className="w-full justify-start bg-white/40 hover:bg-white/60 backdrop-blur-sm h-11 border border-transparent hover:border-white/50"
                                onClick={() => setIsAddingList(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add another list
                            </Button>
                        )}
                    </div>
                </div>
            </DragDropContext>
        </>
    );
};
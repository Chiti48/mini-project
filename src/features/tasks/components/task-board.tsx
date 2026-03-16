"use client";

import { useState, useCallback } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { useGetTaskLists } from "../api/use-get-lists";
import { useCreateTaskList } from "../api/use-create-list";
import { useMoveTaskCard } from "../api/use-move-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "./task-list";
import { Id } from "../../../../convex/_generated/dataModel";

interface TaskBoardProps {
    boardId: Id<"taskBoards">;
}

export const TaskBoard = ({ boardId }: TaskBoardProps) => {
    const lists = useGetTaskLists(boardId);
    const { mutate: moveCard } = useMoveTaskCard();
    const { mutate: createList, isPending } = useCreateTaskList();

    const [isAddingList, setIsAddingList] = useState(false);
    const [newListName, setNewListName] = useState("");

    const onDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) return;

        const { draggableId, source, destination } = result;

        // Don't do anything if dropped in same place
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        // Move the card
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
                setNewListName("");
                setIsAddingList(false);
            },
        });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto p-4 min-h-[calc(100vh-200px)]">
                {lists?.map((list) => (
                    <TaskList
                        key={list._id}
                        listId={list._id}
                        name={list.name}
                    />
                ))}

                {/* Add List */}
                <div className="w-72 shrink-0">
                    {isAddingList ? (
                        <form onSubmit={handleCreateList} className="bg-muted p-3 rounded-lg">
                            <Input
                                placeholder="Enter list title..."
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                className="mb-2"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={isPending}>
                                    Add List
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAddingList(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Button
                            variant="ghost"
                            className="w-full justify-start bg-muted/50 hover:bg-muted"
                            onClick={() => setIsAddingList(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add another list
                        </Button>
                    )}
                </div>
            </div>
        </DragDropContext>
    );
};

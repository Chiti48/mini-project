"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useGetTaskBoards } from "../api/use-get-boards";
import { useCreateTaskBoard } from "../api/use-create-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Id, Doc } from "../../../../convex/_generated/dataModel";

interface TaskBoardListProps {
    workspaceId: Id<"workspaces">;
    onSelectBoard: (boardId: Id<"taskBoards">) => void;
    selectedBoardId?: Id<"taskBoards">;
}

export const TaskBoardList = ({
    workspaceId,
    onSelectBoard,
    selectedBoardId,
}: TaskBoardListProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");

    const { data: boards } = useGetTaskBoards({ workspaceId });
    const { mutate: createBoard, isPending } = useCreateTaskBoard();

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        await createBoard({
            workspaceId,
            name: newBoardName,
        }, {
            onSuccess: () => {
                setNewBoardName("");
                setIsOpen(false);
            },
        });
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto">
                {boards?.map((board: Doc<"taskBoards">) => (
                    <Button
                        key={board._id}
                        variant={selectedBoardId === board._id ? "default" : "outline"}
                        onClick={() => onSelectBoard(board._id)}
                        className="whitespace-nowrap"
                    >
                        {board.name}
                    </Button>
                ))}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Board</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateBoard} className="space-y-4">
                        <Input
                            placeholder="Board name"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                        />
                        <Button type="submit" disabled={isPending || !newBoardName.trim()}>
                            Create Board
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
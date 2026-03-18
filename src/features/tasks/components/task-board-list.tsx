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
    DialogDescription,
} from "@/components/ui/dialog";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner"; // 1. นำเข้า Toast สำหรับแจ้งเตือน

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
            onSuccess: (newBoardId) => { // สมมติว่า API ของคุณคืนค่า ID กลับมา
                toast.success("Board created successfully");
                setNewBoardName("");
                setIsOpen(false);
                
                // ถ้าระบบส่ง ID กลับมา เราสามารถสั่งให้เลือก Board ใหม่นี้อัตโนมัติได้เลย
                if (newBoardId) {
                    onSelectBoard(newBoardId as Id<"taskBoards">);
                }
            },
            onError: () => {
                toast.error("Failed to create board");
            }
        });
    };

    return (
        <div className="flex items-center gap-2 w-full">
            {/* เพิ่ม scrollbar-hide (ถ้าคุณมี utility นี้) หรือใช้เทคนิค CSS ปกติ */}
            <div className="flex gap-2 overflow-x-auto flex-1 pb-1 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {boards?.map((board: Doc<"taskBoards">) => (
                    <Button
                        key={board._id}
                        // ปรับสีให้เข้ากับธีมเขียว ถ้าเป็น Board ที่ถูกเลือก
                        variant={selectedBoardId === board._id ? "default" : "outline"}
                        onClick={() => onSelectBoard(board._id)}
                        className={`whitespace-nowrap transition-colors ${
                            selectedBoardId === board._id 
                                ? "bg-[#337f37] hover:bg-[#337f37]/90 text-white border-transparent" 
                                : ""
                        }`}
                        size="sm"
                    >
                        {board.name}
                    </Button>
                ))}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 size-9">
                        <Plus className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Board</DialogTitle>
                        <DialogDescription>
                            Enter a descriptive name for your new task board.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateBoard} className="space-y-4">
                        <Input
                            placeholder="e.g. Marketing Plan, Q3 Roadmap..."
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            autoFocus
                            disabled={isPending}
                        />
                        {/* 2. จัดเรียงปุ่มให้สวยงาม และมีปุ่ม Cancel */}
                        <div className="flex items-center justify-end gap-2 mt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isPending || !newBoardName.trim()}
                                className="bg-[#337f37] hover:bg-[#337f37]/90 text-white"
                            >
                                {isPending ? "Creating..." : "Create Board"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
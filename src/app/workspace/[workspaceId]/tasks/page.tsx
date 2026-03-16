"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Layout, Plus } from "lucide-react";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { useGetTaskBoards } from "@/features/tasks/api/use-get-boards";
import { useCreateTaskBoard } from "@/features/tasks/api/use-create-board";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Id } from "../../../../../convex/_generated/dataModel";

const TasksPage = () => {
    const params = useParams();
    const workspaceId = params.workspaceId as Id<"workspaces">;

    const { data: currentMember, isLoading: isMemberLoading } = useCurrentMember({ workspaceId });
    const boards = useGetTaskBoards(workspaceId);
    const { mutate: createBoard, isPending } = useCreateTaskBoard();
    const [selectedBoardId, setSelectedBoardId] = useState<Id<"taskBoards"> | undefined>();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");

    // Not a member - show join message
    if (!isMemberLoading && !currentMember) {
        return (
            <div className="h-full flex flex-col bg-linear-to-br from-[#f0fdf4] to-[#dcfce7]">
                <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Layout className="size-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                            Workspace Access Required
                        </h2>
                        <p className="text-gray-500 mb-6">
                            You need to join this workspace before you can access Task Boards. Please join the workspace first.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Select first board by default when boards load
    if (boards && boards.length > 0 && !selectedBoardId) {
        setSelectedBoardId(boards[0]._id);
    }

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        await createBoard({
            workspaceId,
            name: newBoardName,
        }, {
            onSuccess: (boardId) => {
                toast.success("Board created successfully");
                setNewBoardName("");
                setIsCreateOpen(false);
                setSelectedBoardId(boardId as Id<"taskBoards">);
            },
            onError: () => {
                toast.error("Failed to create board");
            },
        });
    };

    return (
        <div className="h-full flex flex-col bg-linear-to-br from-[#f0fdf4] to-[#dcfce7]">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#337f37] rounded-lg">
                        <Layout className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Task Boards</h1>
                        <p className="text-sm text-gray-500">Manage your projects with real-time collaboration</p>
                    </div>
                </div>

                {/* Board Selector */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {boards?.map((board) => (
                            <Button
                                key={board._id}
                                variant={selectedBoardId === board._id ? "default" : "ghost"}
                                onClick={() => setSelectedBoardId(board._id)}
                                className={`whitespace-nowrap transition-all ${
                                    selectedBoardId === board._id
                                        ? "bg-[#337f37] text-white hover:bg-[#2a6b2e]"
                                        : "hover:bg-white"
                                }`}
                                size="sm"
                            >
                                {board.name}
                            </Button>
                        ))}
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Board</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateBoard} className="space-y-4 mt-4">
                                <Input
                                    placeholder="Board name (e.g., Q1 2024 Sprint)"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsCreateOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isPending || !newBoardName.trim()}
                                        className="bg-[#337f37] hover:bg-[#2a6b2e]"
                                    >
                                        {isPending ? "Creating..." : "Create Board"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-hidden">
                {selectedBoardId ? (
                    <TaskBoard boardId={selectedBoardId} />
                ) : (
                    <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center max-w-md">
                            <div className="w-20 h-20 bg-[#337f37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Layout className="size-10 text-[#337f37]" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                                {boards?.length === 0
                                    ? "Welcome to Task Boards!"
                                    : "Select a Board"}
                            </h2>
                            <p className="text-gray-500 mb-6">
                                {boards?.length === 0
                                    ? "Create your first board to start organizing tasks and collaborating with your team in real-time."
                                    : "Choose a board from the selector above or create a new one to get started."}
                            </p>
                            {boards?.length === 0 && (
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="bg-[#337f37] hover:bg-[#2a6b2e]"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Board
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksPage;

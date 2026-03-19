"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Layout, Plus } from "lucide-react";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { useGetTaskBoards } from "@/features/tasks/api/use-get-boards";
import { useCreateTaskBoard } from "@/features/tasks/api/use-create-board";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useConfirm } from "@/hooks/use-confirm";
import { useRemoveTaskBoard } from "@/features/tasks/api/use-remove-board";
import { useUpdateTaskBoard } from "@/features/tasks/api/use-update-board";
import { MoreHorizontal, Trash2, Edit3 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Doc, Id } from "../../../../../convex/_generated/dataModel";

const TasksPage = () => {
    const params = useParams();
    const workspaceId = params.workspaceId as Id<"workspaces">;

    // 1. รับค่า member ตรงๆ เพราะ hook useCurrentMember ยังคง return ค่ามาตรงๆ
    const { data: member, isLoading: isLoadingMember } = useCurrentMember({ workspaceId });

    // 2. ใช้ Destructuring เพราะเราแก้ไฟล์ hook useGetTaskBoards ให้ return { data, isLoading } แล้ว
    const { data: boards, isLoading: isLoadingBoards } = useGetTaskBoards({ workspaceId });

    const { mutate: createBoard, isPending: isCreatingBoard } = useCreateTaskBoard();
    const { mutate: removeBoard } = useRemoveTaskBoard();
    const { mutate: updateBoard, isPending: isUpdatingBoard } = useUpdateTaskBoard(); // ดึง isPending มาด้วยเพื่อใช้ตอน Rename

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Board",
        "Delete this board? All tasks and lists will be permanently deleted.",
    );

    const [selectedBoardId, setSelectedBoardId] = useState<Id<"taskBoards"> | undefined>(undefined);
    const [newBoardName, setNewBoardName] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBoardId, setEditingBoardId] = useState<Id<"taskBoards"> | null>(null);
    const [renameBoardName, setRenameBoardName] = useState("");

    // Not a member - show join message
    if (!isLoadingMember && !member) {
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

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;

        createBoard(
            { workspaceId, name: newBoardName.trim() },
            {
                onSuccess: (boardId) => {
                    toast.success("Board created successfully");
                    setNewBoardName("");
                    setIsCreateOpen(false);
                    setSelectedBoardId(boardId as Id<"taskBoards">);
                },
                onError: () => {
                    toast.error("Failed to create board");
                },
            }
        );
    };

    const handleDeleteBoard = async (boardId: Id<"taskBoards">) => {
        const ok = await confirmDelete();
        if (!ok) return;

        // 3. ปรับให้ส่ง id เป็น object ตามที่ Convex มักจะต้องการ (หรือถ้า API ของคุณรับ ID เพียวๆ ให้แก้กลับเป็น removeBoard(boardId, {...}))
        removeBoard(boardId, {
            onSuccess: () => {
                toast.success("Board deleted successfully");
                if (selectedBoardId === boardId) {
                    const remainingBoards = boards?.filter((b: Doc<"taskBoards">) => b._id !== boardId);
                    setSelectedBoardId(remainingBoards?.[0]?._id);
                }
            },
            onError: (error: Error) => {
                toast.error(error.message || "Failed to delete board");
            },
        });
    };

    const handleRenameBoard = (boardId: Id<"taskBoards">, currentName: string) => {
        setEditingBoardId(boardId);
        setRenameBoardName(currentName);
    };

    const confirmRenameBoard = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!editingBoardId || !renameBoardName.trim()) return;

        updateBoard(
            { boardId: editingBoardId, name: renameBoardName.trim() },
            {
                onSuccess: () => {
                    toast.success("Board renamed successfully");
                    setEditingBoardId(null);
                    setRenameBoardName("");
                },
                onError: (error: Error) => {
                    toast.error(error.message || "Failed to rename board");
                }
            }
        );
    };

    const cancelRenameBoard = () => {
        setEditingBoardId(null);
        setRenameBoardName("");
    };

    // แสดงหน้าโหลดหากข้อมูลบอร์ดยังมาไม่ถึง
    if (isLoadingBoards) {
        return (
            <div className="h-full flex items-center justify-center bg-[#f0fdf4]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#337f37]"></div>
            </div>
        );
    }

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
                        <p className="text-sm text-gray-500 truncate">Manage your projects with real-time collaboration</p>
                    </div>
                </div>

                {/* Board Selector */}
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {boards?.map((board: Doc<"taskBoards">) => (
                            <div key={board._id} className="flex items-center group">
                                <Button
                                    variant={selectedBoardId === board._id ? "default" : "ghost"}
                                    onClick={() => setSelectedBoardId(board._id)}
                                    className={`whitespace-nowrap transition-all ${selectedBoardId === board._id
                                        ? "bg-[#337f37] hover:bg-[#2a6b2e] text-white shadow-sm"
                                        : "text-gray-600 hover:text-[#337f37] hover:bg-[#337f37]/10"
                                        }`}
                                >
                                    {board.name}
                                </Button>

                                {member?.role === "admin" && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => handleRenameBoard(board._id, board.name)}
                                                className="cursor-pointer"
                                            >
                                                <Edit3 className="h-4 w-4 mr-2" />
                                                Rename Board
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteBoard(board._id)}
                                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Board
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
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
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateBoard(); }} className="space-y-4 mt-4">
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
                                        disabled={isCreatingBoard || !newBoardName.trim()}
                                        className="bg-[#337f37] hover:bg-[#2a6b2e] disabled:opacity-50 text-white"
                                    >
                                        {isCreatingBoard ? "Creating..." : "Create Board"}
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
                                    className="bg-[#337f37] hover:bg-[#2a6b2e] text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Board
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <DeleteDialog />

            {/* Rename Board Dialog */}
            <Dialog open={!!editingBoardId} onOpenChange={(open) => !open && cancelRenameBoard()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Board</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={confirmRenameBoard} className="space-y-4 mt-4">
                        <Input
                            placeholder="New board name"
                            value={renameBoardName}
                            onChange={(e) => setRenameBoardName(e.target.value)}
                            disabled={isUpdatingBoard}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={cancelRenameBoard}
                                disabled={isUpdatingBoard}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUpdatingBoard || !renameBoardName.trim()}
                                className="bg-[#337f37] hover:bg-[#2a6b2e] text-white disabled:opacity-50"
                            >
                                {isUpdatingBoard ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default TasksPage;
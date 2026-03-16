"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { TaskBoardList } from "@/features/tasks/components/task-board-list";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { useGetTaskBoards } from "@/features/tasks/api/use-get-boards";
import { Id } from "../../../../convex/_generated/dataModel";

const TasksPage = () => {
    const params = useParams();
    const workspaceId = params.workspaceId as Id<"workspaces">;

    const boards = useGetTaskBoards(workspaceId);
    const [selectedBoardId, setSelectedBoardId] = useState<Id<"taskBoards"> | undefined>();

    // Select first board by default when boards load
    if (boards && boards.length > 0 && !selectedBoardId) {
        setSelectedBoardId(boards[0]._id);
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header with Board Selector */}
            <div className="p-4 border-b">
                <h1 className="text-xl font-semibold mb-4">Task Boards</h1>
                <TaskBoardList
                    workspaceId={workspaceId}
                    onSelectBoard={setSelectedBoardId}
                    selectedBoardId={selectedBoardId}
                />
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-hidden">
                {selectedBoardId ? (
                    <TaskBoard boardId={selectedBoardId} />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <Loader className="size-8 animate-spin text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                {boards?.length === 0
                                    ? "No boards yet. Create your first board to get started!"
                                    : "Select or create a board to get started"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksPage;

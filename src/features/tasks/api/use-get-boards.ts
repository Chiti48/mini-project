import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Get Boards
export const useGetTaskBoards = (workspaceId: Id<"workspaces">) => {
    return useQuery(api.tasks.getBoards, { workspaceId });
};

// Get Board by ID
export const useGetTaskBoardById = (boardId: Id<"taskBoards">) => {
    return useQuery(api.tasks.getBoardById, { boardId });
};

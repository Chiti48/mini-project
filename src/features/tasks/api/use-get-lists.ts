import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetTaskLists = (boardId: Id<"taskBoards">) => {
    return useQuery(api.tasks.getLists, { boardId });
};

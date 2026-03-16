import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetTaskComments = (taskId: Id<"taskCards">) => {
    return useQuery(api.tasks.getComments, { taskId });
};

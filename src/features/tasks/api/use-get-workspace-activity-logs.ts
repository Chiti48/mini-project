import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetWorkspaceActivityLogs = (workspaceId: Id<"workspaces">, limit?: number) => {
    return useQuery(api.tasks.getWorkspaceActivityLogs, { 
        workspaceId,
        paginationOpts: {
            numItems: limit || 20,
            cursor: null,
        }
    });
};

import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useGetTaskCards = (listId: Id<"taskLists">) => {
    return useQuery(api.tasks.getCards, { listId });
};

export const useGetTaskCardById = (cardId: Id<"taskCards">) => {
    return useQuery(api.tasks.getCardById, { cardId });
};

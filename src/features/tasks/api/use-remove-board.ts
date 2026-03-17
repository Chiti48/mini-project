import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useCallback } from "react";

type Options = {
    onSuccess?: (boardId: Id<"taskBoards">) => void;
    onError?: (error: Error) => void;
};

export const useRemoveTaskBoard = () => {
    const mutation = useMutation(api.tasks.removeBoard);

    const mutate = useCallback(async (boardId: Id<"taskBoards">, options?: Options) => {
        try {
            const result = await mutation({ boardId });
            
            if (options?.onSuccess) {
                options.onSuccess(result);
            }
            
            toast.success("Board deleted successfully");
            return result;
        } catch (error) {
            const err = error as Error;
            
            if (options?.onError) {
                options.onError(err);
            } else {
                toast.error(err.message || "Failed to delete board");
            }
            
            throw err;
        }
    }, [mutation]);

    return {
        mutate,
    };
};

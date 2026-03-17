import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useCallback, useState } from "react";

type Options = {
    onSuccess?: (boardId: Id<"taskBoards">) => void;
    onError?: (error: Error) => void;
};

type UpdateBoardArgs = {
    boardId: Id<"taskBoards">;
    name: string;
};

export const useUpdateTaskBoard = () => {
    const mutation = useMutation(api.tasks.updateBoard);
    const [isPending, setIsPending] = useState(false); // 1. เพิ่ม State สำหรับ Loading

    // 2. ปรับให้รับค่าเป็น Object { boardId, name }
    const mutate = useCallback(async (
        { boardId, name }: UpdateBoardArgs, 
        options?: Options
    ) => {
        setIsPending(true);
        try {
            const result = await mutation({ boardId, name });
            
            if (options?.onSuccess) {
                options.onSuccess(result);
            }
            
            return result;
        } catch (error) {
            const err = error as Error;
            
            if (options?.onError) {
                options.onError(err);
            } else {
                toast.error(err.message || "Failed to rename board");
            }
            
            throw err;
        } finally {
            setIsPending(false);
        }
    }, [mutation]);

    return {
        mutate,
        isPending, 
    };
};
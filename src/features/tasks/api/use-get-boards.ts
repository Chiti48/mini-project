import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetTaskBoardsProps {
    workspaceId: Id<"workspaces">;
}

// Get Boards
// แก้ไข: รับค่าเข้ามาเป็น Object { workspaceId } เพื่อให้ตรงกับตอนเรียกใช้
export const useGetTaskBoards = ({ workspaceId }: UseGetTaskBoardsProps) => {
    const data = useQuery(api.tasks.getBoards, { workspaceId });
    
    return {
        data,
        isLoading: data === undefined,
    };
};

interface UseGetTaskBoardByIdProps {
    boardId: Id<"taskBoards">;
}

// Get Board by ID
// แก้ไข: รับค่าเข้ามาเป็น Object { boardId } เช่นกันเพื่อความเป็นมาตรฐาน
export const useGetTaskBoardById = ({ boardId }: UseGetTaskBoardByIdProps) => {
    const data = useQuery(api.tasks.getBoardById, { boardId });
    
    return {
        data,
        isLoading: data === undefined,
    };
};
"use client";

import dynamic from "next/dynamic";
import { CreateChannelModal } from "@/features/channels/components/create-channel-modal";
// ใช้ dynamic import และปิด SSR (Server-Side Rendering)
const CreateWorkspaceModal = dynamic(
    () => import("@/features/workspaces/components/create-workspace-modal").then(mod => mod.CreateWorkspaceModal),
    { ssr: false }
);

export const Modals = () => {
    // ไม่ต้องใช้ useEffect และ useState แล้ว
    return (
        <>
            <CreateWorkspaceModal />
            <CreateChannelModal />
        </>
    );
};
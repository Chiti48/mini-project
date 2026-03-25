"use client";

import { useParams, useRouter } from "next/navigation";
import { DirectMessageChat } from "@/features/direct-messages/components/direct-message-popup";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DirectMessagePopupPage() {
    const router = useRouter();
    const params = useParams();
    const conversationId = params?.dmId as Id<"directConversations">;
    const workspaceId = params?.workspaceId as string;

    const handleClose = () => {
        router.push(`/workspace/${workspaceId}`);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!conversationId) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-background rounded-xl shadow-2xl p-6">
                    <p className="text-muted-foreground">Invalid conversation ID</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div 
                className="relative w-full max-w-2xl h-[80vh] bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 rounded-full hover:bg-muted"
                >
                    <X className="size-5" />
                </Button>
                <div className="flex-1 overflow-hidden">
                    <DirectMessageChat conversationId={conversationId} workspaceId={workspaceId} />
                </div>
            </div>
        </div>
    );
}

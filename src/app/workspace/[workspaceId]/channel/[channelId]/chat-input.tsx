import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useChannelId } from "@/hooks/use-channel-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic"
import Quill from "quill";
import { useRef, useState } from "react";
import { toast } from "sonner";


const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface ChatInputProps {
    placeholder: string;
};

export const ChatInput = ({ placeholder }: ChatInputProps) => {
    const [editorKey, setEditorKey] = useState(0);
    const [isPendding, setIsPendding] = useState(false);

    const editorRef = useRef<Quill | null>(null);

    const channelId = useChannelId();
    const workspaceId = useWorkspaceId();

    const { mutate: createMessage } = useCreateMessage();

    const handleSubmit = async ({
        body,
        image
    }: {
        body: string;
        image: File | null;
    }) => {
        try {
            setIsPendding(true);
            await createMessage({
                workspaceId,
                channelId,
                body,
            }, { throwError: true });

            setEditorKey((prevKey) => prevKey + 1);
        } catch (error) {
            console.error("Mutation error:", error);
            toast.error("Failed to send message");
        } finally {
            setIsPendding(false);
        }
    };

    return (
        <div className="px-5 w-full">
            <Editor
                key={editorKey}
                placeholder={placeholder}
                onSubmit={handleSubmit}
                disabled={isPendding}
                innerRef={editorRef}
            />
        </div>
    )
}
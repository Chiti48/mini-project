"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Quill from "quill";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { useSendDirectMessage } from "../hooks/use-conversation-actions";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface DmChatInputProps {
    conversationId: Id<"directConversations">;
    placeholder?: string;
}

export const DmChatInput = ({ conversationId, placeholder }: DmChatInputProps) => {
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPending] = useState(false);
    const editorRef = useRef<Quill | null>(null);

    const { sendMessage } = useSendDirectMessage();
    const { mutate: generateUploadUrl } = useGenerateUploadUrl();

    const handleSubmit = async ({
        body,
        image,
        file,
    }: {
        body: string;
        image: File | null;
        file: File | null;
    }) => {
        try {
            setIsPending(true);
            editorRef?.current?.enable(false);

            let imageStorageId: Id<"_storage"> | undefined = undefined;
            let attachments: { id: Id<"_storage">; name: string }[] | undefined = undefined;

            // Upload image
            if (image) {
                const url = await generateUploadUrl({ throwError: true });
                if (!url) throw new Error("Upload URL not found");

                const result = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": image.type },
                    body: image,
                });
                if (!result.ok) throw new Error("Failed to upload image");

                const { storageId } = await result.json();
                imageStorageId = storageId;
            }

            // Upload file as named attachment (separate from image)
            if (file) {
                const url = await generateUploadUrl({ throwError: true });
                if (!url) throw new Error("Upload URL not found");

                const result = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": file.type || "application/octet-stream" },
                    body: file,
                });
                if (!result.ok) throw new Error("Failed to upload file");

                const { storageId } = await result.json();
                attachments = [{ id: storageId, name: file.name }];
            }

            await sendMessage(conversationId, body, imageStorageId, attachments);
            setEditorKey((prev) => prev + 1);
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
        } finally {
            setIsPending(false);
            editorRef?.current?.enable(true);
        }
    };

    return (
        <div className="px-5 pb-4 bg-background shrink-0">
            <Editor
                key={editorKey}
                placeholder={placeholder ?? "Type a message..."}
                onSubmit={handleSubmit}
                disabled={isPending}
                innerRef={editorRef}
            />
        </div>
    );
};

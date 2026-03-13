/* eslint-disable @next/next/no-img-element */
import {
    Dialog,
    DialogContent,
    DialogHeader,   
    DialogTitle,     
    DialogTrigger,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";

interface ThumbnailProps {
    url: string | null | undefined;
};

export const Thumbnail = ({ url }: ThumbnailProps) => {

    if (!url) return null;

    return (
        <Dialog>
            <DialogTrigger>
                <div className="relative overflow-hidden max-w-90 border rounded-lg my-2 cursor-zoom-in">
                    <img
                        src={url}
                        alt="Message image"
                        className="rounded-md object-cover size-full"
                    />
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-200 border-none bg-transparent p-0 shadow-none">
                {/* เพิ่มส่วนนี้เข้าไป เพื่อซ่อน Title ไว้สำหรับ Screen Reader เท่านั้น */}
                <DialogHeader className="sr-only">
                    <DialogTitle>Image preview</DialogTitle>
                </DialogHeader>

                <img
                    src={url}
                    alt="Message image"
                    className="rounded-md object-cover size-full"
                />
            </DialogContent>
        </Dialog>
    );
};
import { useState } from "react";
import dynamic from "next/dynamic";
import data from "@emoji-mart/data";

import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";

// 1. โหลด Picker แบบ Dynamic ป้องกัน Error หน้าจอดำใน Next.js
const Picker = dynamic(() => import("@emoji-mart/react"), { 
    ssr: false,
    loading: () => <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
});

// 2. สร้าง Type ขึ้นมาแทนการใช้คำว่า 'any' เพื่อแก้ Error เส้นสีแดง
export type EmojiData = {
    id: string;
    name: string;
    native: string;
    [key: string]: unknown; // ใช้ unknown แทน any
}

interface EmojiPopoverProps {
    children: React.ReactNode;
    hint?: string;
    // ใช้ Type ที่เราสร้างไว้แทน any
    onEmojiSelect: (emoji: EmojiData) => void;
    align?: "start" | "center" | "end"; // เพิ่ม Option ให้ปรับตำแหน่งได้
    side?: "top" | "bottom" | "left" | "right"; // เพิ่ม Option ให้ปรับทิศทางได้
};

export const EmojiPopover = ({
    children,
    hint = "Emoji",
    onEmojiSelect,
    align = "center", // ค่าเริ่มต้นให้อยู่ตรงกลาง
    side = "bottom",  // ค่าเริ่มต้นให้เด้งลงล่าง
}: EmojiPopoverProps) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    
    // เปลี่ยน any เป็น EmojiData
    const onSelect = (emoji: EmojiData) => {
        onEmojiSelect(emoji);
        setPopoverOpen(false);

        setTimeout(() => {
            setTooltipOpen(false);
        }, 500);
    };

    return (
        <TooltipProvider>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <Tooltip
                    open={tooltipOpen}
                    onOpenChange={setTooltipOpen}
                    delayDuration={50}
                >
                    <PopoverTrigger asChild>
                        <TooltipTrigger asChild>
                            {children}
                        </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent className="bg-black text-white border border-white/5">
                        <p className="font-medium text-xs">{hint}</p>
                    </TooltipContent>
                </Tooltip>
                <PopoverContent 
                    align={align}
                    side={side}
                    className="p-0 w-full border-none shadow-none z-50">
                    <Picker 
                        data={data}
                        theme="light"
                        onEmojiSelect={onSelect}
                    />
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    );
};
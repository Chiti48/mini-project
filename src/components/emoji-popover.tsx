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

const Picker = dynamic(() => import("@emoji-mart/react"), { 
    ssr: false,
    loading: () => <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
});

export type EmojiData = {
    id: string;
    name: string;
    native: string;
    [key: string]: unknown;
}

interface EmojiPopoverProps {
    children: React.ReactNode;
    hint?: string;
    onEmojiSelect: (emoji: EmojiData) => void;
    align?: "start" | "center" | "end";
    side?: "top" | "bottom" | "left" | "right";
};

export const EmojiPopover = ({
    children,
    hint = "Emoji",
    onEmojiSelect,
    align = "center", 
    side = "bottom",
}: EmojiPopoverProps) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    
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
                    <TooltipContent className="bg-black text-white border border-white/5 z-50">
                        <p className="font-medium text-xs">{hint}</p>
                    </TooltipContent>
                </Tooltip>

                <PopoverContent 
                    side={side}
                    align={align}
                    sideOffset={8}
                    className="p-0 w-auto border-none shadow-none drop-shadow-md z-50"
                >
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
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DmHeaderProps {
    name?: string;
    image?: string;
    email?: string;
    onBack?: () => void;
}

export const DmHeader = ({ name, image, email, onBack }: DmHeaderProps) => {
    const displayName = name || email || "Unknown";
    const fallback = displayName[0].toUpperCase();

    return (
        <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden shrink-0">
            {onBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="mr-2 shrink-0"
                >
                    <ArrowLeft className="size-5 text-muted-foreground" />
                </Button>
            )}
            <Button
                variant="ghost"
                className="text-lg font-semibold px-2 overflow-hidden w-auto h-auto py-0"
                size="sm"
            >
                <Avatar className="size-8 mr-2">
                    <AvatarImage src={image} />
                    <AvatarFallback className="rounded-md bg-sky-500 text-white text-xs">
                        {fallback}
                    </AvatarFallback>
                </Avatar>
                <span className="truncate">{displayName}</span>
            </Button>
        </div>
    );
};

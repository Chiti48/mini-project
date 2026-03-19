"use client";

import { Button } from "@/components/ui/button";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Info, Search, Hash, User } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { useState, useEffect } from "react";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useRouter } from "next/navigation";

export const Toolbar = () => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();

    const { data: members } = useGetMembers({ workspaceId });
    const { data: channels } = useGetChannels({ workspaceId });
    const { data } = useGetWorkspace({ id: workspaceId });

    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const onChannelClick = (channelId: string) => {
        setOpen(false);
        router.push(`/workspace/${workspaceId}/channel/${channelId}`);
    };

    const onMemberClick = (memberId: string) => {
        setOpen(false);
        router.push(`/workspace/${workspaceId}/member/${memberId}`);
    };

    return (
        <nav className="bg-[oklch(35.5%_0.07_142)] flex items-center justify-between h-10 p-1.5 shadow-sm">
            <div className="flex-1" />

            <div className="min-w-[280px] max-w-[642px] grow-[2] shrink">
                <Button
                    onClick={() => setOpen(true)}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 w-full justify-between h-7 px-3 border-none ring-0 shadow-none transition-all"
                >
                    <div className="flex items-center">
                        <Search className="size-4 text-emerald-50 mr-2" />
                        <span className="text-emerald-50 text-xs font-medium">
                            Search {data?.name} workspace
                        </span>
                    </div>
                    {/* แสดง Hint ว่าใช้คีย์ลัดได้ */}
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-emerald-50 opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>

                <CommandDialog open={open} onOpenChange={setOpen}>
                    <CommandInput placeholder={`Search channels and members in ${data?.name}...`} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>

                        <CommandGroup heading="Channels">
                            {channels?.map((channel) => (
                                <CommandItem
                                    key={channel._id}
                                    value={channel.name}
                                    onSelect={() => onChannelClick(channel._id)}
                                    className="cursor-pointer"
                                >
                                    <Hash className="mr-2 size-4 text-slate-400" />
                                    <span>{channel.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Members">
                            {members?.map((member) => (
                                <CommandItem
                                    key={member._id}
                                    value={member.user.name}
                                    onSelect={() => onMemberClick(member._id)}
                                    className="cursor-pointer"
                                >
                                    <User className="mr-2 size-4 text-slate-400" />
                                    <span>{member.user.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                    </CommandList>
                </CommandDialog>
            </div>

            <div className="ml-auto flex-1 flex items-center justify-end">
                <Button variant="transparent" size="iconSm" onClick={() => router.push('/page-developing')}>
                    <Info className="size-5 text-emerald-50 hover:text-white transition-colors" />
                </Button>
            </div>
        </nav>
    );
};
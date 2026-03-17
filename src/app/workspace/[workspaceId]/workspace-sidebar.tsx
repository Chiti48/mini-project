import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { AlertTriangle, Layout, Loader, MessageSquareText, SendHorizonal } from "lucide-react";
import { WorkspaceHeader } from "./workspace-header";
import { SidebarItem } from "./sidebar-item";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { WorkspaceSection } from "./workspace-section";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { UserItem } from "./user-item";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useChannelId } from "@/hooks/use-channel-id";
import { useMemberId } from "@/hooks/use-member-id";
import { TaskBoardsLink } from "./task-boards-link";
import { useRouter } from "next/navigation";
import { ChannelItem } from "./channel-item";

export const WorkspaceSidebar = () => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const channelId = useChannelId();
    const memberId = useMemberId();
    const [, setOpen] = useCreateChannelModal();

    const { data: member, isLoading: memberLoading } = useCurrentMember({ workspaceId });
    const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({ id: workspaceId });
    const { data: channels, isLoading: channelsLoading } = useGetChannels({ workspaceId });
    const { data: members } = useGetMembers({ workspaceId });

    if (workspaceLoading || memberLoading || channelsLoading) {
        return (
            <div className="flex flex-col bg-[#337f37] h-full items-center justify-center">
                <Loader className="size-5 animate-spin text-white" />
            </div>
        );
    }

    if (!workspace || !member) {
        return (
            <div className="flex flex-col gap-y-2 bg-[#337f37] h-full items-center justify-center">
                <AlertTriangle className="size-5 animate-bounce text-white" />
                <p className="text-white text-sm">Workspace not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-[#337f37] h-full"> {/* ใช้สีเขียวตามธีม */}
            <WorkspaceHeader workspace={workspace} isAdmin={member.role === "admin"} />

            <div className="flex flex-col px-2 mt-3 gap-y-1">
                <SidebarItem label="Threads" icon={MessageSquareText} id="threads" />
                <SidebarItem label="Drafts & Sent" icon={SendHorizonal} id="drafts" />
                <TaskBoardsLink label="Task Boards" icon={Layout} />
            </div>

            <WorkspaceSection
                label="Channels"
                hint="New channel"
                onNew={member.role === "admin" ? () => setOpen(true) : undefined}
            >
                {channels?.map((item) => (
                    <ChannelItem
                        key={item._id}
                        label={item.name}
                        channelId={item._id}
                        isActive={channelId === item._id}
                        onClick={() => {
                            router.push(`/workspace/${workspaceId}/channel/${item._id}`);
                        }}
                    />
                ))}
            </WorkspaceSection>

            <WorkspaceSection
                label="Direct Message"
                hint="New direct message"
                onNew={() => { }}
            >
                {members?.map((item) => (
                    <UserItem
                        key={item._id}
                        id={item._id}
                        label={item.user.name}
                        image={item.user.image}
                        variant={item._id === memberId ? "active" : "default"}
                        onClick={() => {
                            router.push(`/workspace/${workspaceId}/member/${item._id}`);
                        }}
                    />
                ))}
            </WorkspaceSection>
        </div>
    )
};
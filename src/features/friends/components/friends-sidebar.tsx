"use client";

import { useState } from "react";
import { useGetFriends, useSearchUsers, useGetPendingRequests } from "../hooks/use-get-friends";
import { useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest } from "../hooks/use-friend-actions";
import { useCreateDirectConversation } from "../../direct-messages/hooks/use-conversation-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogTrigger 
} from "@/components/ui/dialog";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
    UserPlus, 
    MessageCircle, 
    MoreVertical, 
    Check, 
    X, 
    Search,
    User,
    Clock
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface FriendsSidebarProps {
    workspaceId?: string;
}

export const FriendsSidebar = ({ workspaceId }: FriendsSidebarProps) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

    const { data: friends, isLoading: friendsLoading } = useGetFriends();
    const { data: pendingRequests, isLoading: requestsLoading } = useGetPendingRequests();
    const { data: searchResults, isLoading: searchLoading } = useSearchUsers(searchQuery);

    const { sendRequest } = useSendFriendRequest();
    const { acceptRequest } = useAcceptFriendRequest();
    const { rejectRequest } = useRejectFriendRequest();
    const { createConversation } = useCreateDirectConversation();

    const handleSendRequest = async (receiverId: Id<"users">) => {
        try {
            await sendRequest(receiverId);
            toast.success("Friend request sent!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send request");
        }
    };

    const handleAcceptRequest = async (requestId: Id<"friendRequests">) => {
        try {
            await acceptRequest(requestId);
            toast.success("Friend request accepted!");
        } catch {
            toast.error("Failed to accept request");
        }
    };

    const handleRejectRequest = async (requestId: Id<"friendRequests">) => {
        try {
            await rejectRequest(requestId);
            toast.success("Friend request rejected");
        } catch {
            toast.error("Failed to reject request");
        }
    };

    const handleStartConversation = async (e: React.MouseEvent, friendId: Id<"users">) => {
        e.stopPropagation();
        try {
            const conversationId = await createConversation(friendId);
            if (workspaceId) {
                router.push(`/workspace/${workspaceId}/dm-workspace/${conversationId}`);
            } else {
                router.push(`/dm/${conversationId}`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to start conversation");
        }
    };

    const pendingCount = pendingRequests?.length || 0;

    return (
        <div className="flex flex-col h-full bg-[#2d6a32] text-white border-l border-[#1e4d24]">
            {/* Header */}
            <div className="p-4 border-b border-[#1e4d24]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                        <User className="w-5 h-5" />
                        Friends
                    </h2>
                    <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                                <UserPlus className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add Friend</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by email or name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                
                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {searchLoading ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                            Searching...
                                        </div>
                                    ) : searchResults?.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {searchQuery ? "No users found" : "Type to search users"}
                                        </div>
                                    ) : (
                                        searchResults?.map((user) => (
                                            <div
                                                key={user._id}
                                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user.image} />
                                                        <AvatarFallback className="rounded-md text-white bg-sky-500">
                                                            {user.name?.[0] || user.email?.[0] || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">{user.name || "Unknown"}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                                {user.friendshipStatus === "accepted" ? (
                                                    <Badge variant="secondary">Friends</Badge>
                                                ) : user.friendshipStatus === "pending" ? (
                                                    <Badge variant="outline">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSendRequest(user._id)}
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-1" />
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === "friends" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("friends")}
                        className={`flex-1 ${activeTab === "friends" ? "bg-white/20 text-white hover:bg-white/30" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                    >
                        All Friends
                        {friends && (
                            <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                                {friends.length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === "requests" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("requests")}
                        className={`flex-1 ${activeTab === "requests" ? "bg-white/20 text-white hover:bg-white/30" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                    >
                        Requests
                        {pendingCount > 0 && (
                            <Badge variant="destructive" className="ml-2 bg-red-500 text-white">
                                {pendingCount}
                            </Badge>
                        )}
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2">
                {activeTab === "friends" ? (
                    // Friends List
                    friendsLoading ? (
                        <div className="text-center py-8 text-white/70">Loading friends...</div>
                    ) : friends?.length === 0 ? (
                        <div className="text-center py-8 text-white/70">
                            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No friends yet</p>
                            <p className="text-sm opacity-70">Click Add to find friends</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {friends?.map((friend) => {
                                const user = friend.user;
                                if (!user) return null;
                                return (
                                    <div
                                        key={user._id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 group cursor-pointer"
                                   //     onClick={(e) => handleStartConversation(e, user._id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2">
                                                <AvatarImage src={user.image} />
                                                <AvatarFallback className="rounded-md text-white bg-sky-500">
                                                    {user.name?.[0] || user.email?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm text-white">{user.name || "Unknown"}</p>
                                                <p className="text-xs text-white/60">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => { e.stopPropagation(); handleStartConversation(e, user._id); }}
                                                className="text-white hover:bg-white/20"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem 
                                                        className="text-red-600"
                                                        onClick={() => {/* Add remove friend logic */}}
                                                    >
                                                        Remove Friend
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    // Requests List
                    requestsLoading ? (
                        <div className="text-center py-8 text-white/70">Loading requests...</div>
                    ) : pendingRequests?.length === 0 ? (
                        <div className="text-center py-8 text-white/70">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No pending requests</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingRequests?.map((request) => (
                                <div
                                    key={request._id}
                                    className="p-3 rounded-lg border border-white/20 bg-white/5"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="h-10 w-10 border-2 border-white/20">
                                            <AvatarImage src={request.sender?.image} />
                                            <AvatarFallback className="bg-[#1e4d24] text-white">
                                                {request.sender?.name?.[0] || request.sender?.email?.[0] || "?"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm text-white">{request.sender?.name || "Unknown"}</p>
                                            <p className="text-xs text-white/60">{request.sender?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                                            onClick={() => handleAcceptRequest(request._id)}
                                        >
                                            <Check className="w-4 h-4 mr-1" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-white border-red-800 hover:bg-red-500/50 bg-red-800"
                                            onClick={() => handleRejectRequest(request._id)}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

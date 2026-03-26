import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

/**
 * Send a friend request to another user
 */
export const sendRequest = mutation({
    args: {
        receiverId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Cannot send request to yourself
        if (userId === args.receiverId) {
            throw new Error("Cannot send friend request to yourself");
        }

        // Check if receiver exists
        const receiver = await ctx.db.get(args.receiverId);
        if (!receiver) {
            throw new Error("User not found");
        }

        // Check if request already exists
        const existingRequest = await ctx.db
            .query("friendRequests")
            .withIndex("by_sender_receiver", (q) =>
                q.eq("senderId", userId).eq("receiverId", args.receiverId)
            )
            .unique();

        if (existingRequest) {
            if (existingRequest.status === "pending") {
                throw new Error("Friend request already sent");
            } else if (existingRequest.status === "accepted") {
                throw new Error("Already friends with this user");
            }
            // If rejected, allow resending by updating the existing request
            await ctx.db.patch(existingRequest._id, {
                status: "pending",
                updatedAt: Date.now(),
            });
            return existingRequest._id;
        }

        // Check if reverse request exists (other person already sent request)
        const reverseRequest = await ctx.db
            .query("friendRequests")
            .withIndex("by_sender_receiver", (q) =>
                q.eq("senderId", args.receiverId).eq("receiverId", userId)
            )
            .unique();

        if (reverseRequest && reverseRequest.status === "accepted") {
            throw new Error("Already friends with this user");
        }

        if (reverseRequest && reverseRequest.status === "pending") {
            // Auto-accept if both sent requests to each other
            await ctx.db.patch(reverseRequest._id, {
                status: "accepted",
                updatedAt: Date.now(),
            });
            return reverseRequest._id;
        }

        // Create new friend request
        const requestId = await ctx.db.insert("friendRequests", {
            senderId: userId,
            receiverId: args.receiverId,
            status: "pending",
            createdAt: Date.now(),
        });

        return requestId;
    },
});

/**
 * Accept a friend request
 */
export const acceptRequest = mutation({
    args: {
        requestId: v.id("friendRequests"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Friend request not found");
        }

        // Only the receiver can accept
        if (request.receiverId !== userId) {
            throw new Error("Not authorized to accept this request");
        }

        if (request.status !== "pending") {
            throw new Error("Request is no longer pending");
        }

        await ctx.db.patch(args.requestId, {
            status: "accepted",
            updatedAt: Date.now(),
        });

        return true;
    },
});

/**
 * Reject a friend request
 */
export const rejectRequest = mutation({
    args: {
        requestId: v.id("friendRequests"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) {
            throw new Error("Friend request not found");
        }

        // Only the receiver can reject
        if (request.receiverId !== userId) {
            throw new Error("Not authorized to reject this request");
        }

        if (request.status !== "pending") {
            throw new Error("Request is no longer pending");
        }

        await ctx.db.patch(args.requestId, {
            status: "rejected",
            updatedAt: Date.now(),
        });

        return true;
    },
});

/**
 * Remove a friend (delete the accepted request)
 */
export const removeFriend = mutation({
    args: {
        friendId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Find the friend request in either direction
        const request = await ctx.db
            .query("friendRequests")
            .filter((q) =>
                q.or(
                    q.and(
                        q.eq(q.field("senderId"), userId),
                        q.eq(q.field("receiverId"), args.friendId)
                    ),
                    q.and(
                        q.eq(q.field("senderId"), args.friendId),
                        q.eq(q.field("receiverId"), userId)
                    )
                )
            )
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .unique();

        if (!request) {
            throw new Error("Friend not found");
        }

        await ctx.db.delete(request._id);

        // Also delete any conversations between these users
        const conversation = await ctx.db
            .query("directConversations")
            .withIndex("by_user_one_user_two", (q) =>
                q.eq("userOneId", userId).eq("userTwoId", args.friendId)
            )
            .unique();

        if (conversation) {
            await ctx.db.delete(conversation._id);
        }

        const reverseConversation = await ctx.db
            .query("directConversations")
            .withIndex("by_user_one_user_two", (q) =>
                q.eq("userOneId", args.friendId).eq("userTwoId", userId)
            )
            .unique();

        if (reverseConversation) {
            await ctx.db.delete(reverseConversation._id);
        }

        return true;
    },
});

/**
 * Get pending friend requests received by current user
 */
export const getPendingRequests = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return [];
        }

        const requests = await ctx.db
            .query("friendRequests")
            .withIndex("by_receiver_id", (q) => q.eq("receiverId", userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        // Get sender details for each request
        const requestsWithUsers = await Promise.all(
            requests.map(async (request) => {
                const sender = await ctx.db.get(request.senderId);
                return {
                    ...request,
                    sender,
                };
            })
        );

        return requestsWithUsers;
    },
});

/**
 * Get sent friend requests
 */
export const getSentRequests = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return [];
        }

        const requests = await ctx.db
            .query("friendRequests")
            .withIndex("by_sender_id", (q) => q.eq("senderId", userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        // Get receiver details for each request
        const requestsWithUsers = await Promise.all(
            requests.map(async (request) => {
                const receiver = await ctx.db.get(request.receiverId);
                return {
                    ...request,
                    receiver,
                };
            })
        );

        return requestsWithUsers;
    },
});

/**
 * Get list of all friends
 */
export const getFriends = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return [];
        }

        // Get all accepted requests where user is either sender or receiver
        const sentRequests = await ctx.db
            .query("friendRequests")
            .withIndex("by_sender_id", (q) => q.eq("senderId", userId))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .collect();

        const receivedRequests = await ctx.db
            .query("friendRequests")
            .withIndex("by_receiver_id", (q) => q.eq("receiverId", userId))
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .collect();

        const allFriendIds = [
            ...sentRequests.map((r) => r.receiverId),
            ...receivedRequests.map((r) => r.senderId),
        ];

        // Get user details for each friend
        const friends = await Promise.all(
            allFriendIds.map(async (friendId) => {
                const user = await ctx.db.get(friendId);
                // Get conversation ID if exists
                const conversation = await ctx.db
                    .query("directConversations")
                    .withIndex("by_user_one_user_two", (q) =>
                        q.eq("userOneId", userId).eq("userTwoId", friendId)
                    )
                    .unique();

                const reverseConversation = await ctx.db
                    .query("directConversations")
                    .withIndex("by_user_one_user_two", (q) =>
                        q.eq("userOneId", friendId).eq("userTwoId", userId)
                    )
                    .unique();

                return {
                    user,
                    conversationId: conversation?._id || reverseConversation?._id || null,
                };
            })
        );

        return friends.filter((f) => f.user !== null);
    },
});

/**
 * Check friendship status with another user
 */
export const getFriendshipStatus = query({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return null;
        }

        // Check if request exists in either direction
        const request = await ctx.db
            .query("friendRequests")
            .filter((q) =>
                q.or(
                    q.and(
                        q.eq(q.field("senderId"), userId),
                        q.eq(q.field("receiverId"), args.otherUserId)
                    ),
                    q.and(
                        q.eq(q.field("senderId"), args.otherUserId),
                        q.eq(q.field("receiverId"), userId)
                    )
                )
            )
            .unique();

        if (!request) {
            return "none";
        }

        return request.status;
    },
});

/**
 * Search users by email or name
 */
export const searchUsers = query({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        // Require at least 2 characters to avoid scanning entire users table
        if (!userId || args.query.trim().length < 2) {
            return [];
        }

        // Get all users and filter (client-side filter since no search index)
        const users = await ctx.db.query("users").collect();

        const searchLower = args.query.toLowerCase();
        const filteredUsers = users
            .filter((u) => u._id !== userId)
            .filter((u) => {
                const emailMatch = u.email?.toLowerCase().includes(searchLower);
                const nameMatch = u.name?.toLowerCase().includes(searchLower);
                return emailMatch || nameMatch;
            })
            .slice(0, 10);

        // Get friendship status for each result in parallel
        const usersWithStatus = await Promise.all(
            filteredUsers.map(async (user) => {
                const status = await ctx.db
                    .query("friendRequests")
                    .filter((q) =>
                        q.or(
                            q.and(
                                q.eq(q.field("senderId"), userId),
                                q.eq(q.field("receiverId"), user._id)
                            ),
                            q.and(
                                q.eq(q.field("senderId"), user._id),
                                q.eq(q.field("receiverId"), userId)
                            )
                        )
                    )
                    .unique();

                return {
                    ...user,
                    friendshipStatus: status?.status || "none",
                };
            })
        );

        return usersWithStatus;
    },
});

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { paginationOptsValidator } from "convex/server";

/**
 * Create or get existing direct conversation between two users
 */
export const createOrGet = mutation({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Check if they're friends
        const friendship = await ctx.db
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
            .filter((q) => q.eq(q.field("status"), "accepted"))
            .unique();

        if (!friendship) {
            throw new Error("Can only message friends");
        }

        // Check if conversation already exists
        const existingConversation = await ctx.db
            .query("directConversations")
            .withIndex("by_user_one_user_two", (q) =>
                q.eq("userOneId", userId).eq("userTwoId", args.otherUserId)
            )
            .unique();

        if (existingConversation) {
            return existingConversation._id;
        }

        const reverseConversation = await ctx.db
            .query("directConversations")
            .withIndex("by_user_one_user_two", (q) =>
                q.eq("userOneId", args.otherUserId).eq("userTwoId", userId)
            )
            .unique();

        if (reverseConversation) {
            return reverseConversation._id;
        }

        // Create new conversation
        const conversationId = await ctx.db.insert("directConversations", {
            userOneId: userId,
            userTwoId: args.otherUserId,
            createdAt: Date.now(),
        });

        return conversationId;
    },
});

/**
 * Get all direct conversations for current user
 */
export const getConversations = query({
    args: {
        limit: v.optional(v.number()),    // items per page, default 20
        cursor: v.optional(v.number()),   // offset (index to start from)
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return { conversations: [], hasMore: false };
        }

        const limit = args.limit ?? 20;
        const cursor = args.cursor ?? 0;

        // Fetch both sides of conversations in parallel
        const [conversationsAsUserOne, conversationsAsUserTwo] = await Promise.all([
            ctx.db
                .query("directConversations")
                .withIndex("by_user_one_id", (q) => q.eq("userOneId", userId))
                .collect(),
            ctx.db
                .query("directConversations")
                .withIndex("by_user_two_id", (q) => q.eq("userTwoId", userId))
                .collect(),
        ]);

        const allConversations = [...conversationsAsUserOne, ...conversationsAsUserTwo];

        // Enrich all conversations with metadata in parallel (needed for sorting)
        const conversationsWithDetails = await Promise.all(
            allConversations.map(async (conv) => {
                const otherUserId = conv.userOneId === userId ? conv.userTwoId : conv.userOneId;

                const [otherUser, lastMessages, readReceipt] = await Promise.all([
                    ctx.db.get(otherUserId),
                    ctx.db
                        .query("directMessages")
                        .withIndex("by_conversation_created", (q) =>
                            q.eq("conversationId", conv._id)
                        )
                        .order("desc")
                        .take(1),
                    ctx.db
                        .query("directReadReceipts")
                        .withIndex("by_user_conversation", (q) =>
                            q.eq("userId", userId).eq("conversationId", conv._id)
                        )
                        .unique(),
                ]);

                const lastMessage = lastMessages[0] || null;

                const unreadCount = await ctx.db
                    .query("directMessages")
                    .withIndex("by_conversation_id", (q) =>
                        q.eq("conversationId", conv._id)
                    )
                    .filter((q) =>
                        q.gt(q.field("createdAt"), readReceipt?.lastReadAt || 0)
                    )
                    .filter((q) => q.neq(q.field("senderId"), userId))
                    .collect()
                    .then((msgs) => msgs.length);

                return {
                    ...conv,
                    otherUser,
                    lastMessage,
                    unreadCount,
                };
            })
        );

        // Sort by most recent message (newest first), then paginate
        const sorted = conversationsWithDetails.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.createdAt;
            const timeB = b.lastMessage?.createdAt || b.createdAt;
            return timeB - timeA;
        });

        const page = sorted.slice(cursor, cursor + limit);
        const hasMore = cursor + limit < sorted.length;

        return { conversations: page, hasMore, total: sorted.length };
    },
});

/**
 * Get a specific conversation by ID
 */
export const getById = query({
    args: {
        conversationId: v.id("directConversations"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return null;
        }

        const conversation = await ctx.db.get(args.conversationId);

        if (!conversation) {
            return null;
        }

        // Verify user is part of this conversation
        if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
            return null;
        }

        const otherUserId = conversation.userOneId === userId ? conversation.userTwoId : conversation.userOneId;
        const otherUser = await ctx.db.get(otherUserId);

        return {
            ...conversation,
            otherUser,
        };
    },
});

/**
 * Get messages for a conversation (paginated)
 */
export const getMessages = query({
    args: {
        conversationId: v.id("directConversations"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return { page: [], continueCursor: "", isDone: true };
        }

        // Verify user is part of this conversation
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            return { page: [], continueCursor: "", isDone: true };
        }

        if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
            return { page: [], continueCursor: "", isDone: true };
        }

        // Get messages with pagination
        const messages = await ctx.db
            .query("directMessages")
            .withIndex("by_conversation_created", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("desc")
            .paginate(args.paginationOpts);

        // Populate sender info and resolve storage URLs — all in parallel
        const messagesWithSender = await Promise.all(
            messages.page.map(async (msg) => {
                const [sender, imageUrl, resolvedAttachments] = await Promise.all([
                    ctx.db.get(msg.senderId),
                    msg.image ? ctx.storage.getUrl(msg.image) : Promise.resolve(null),
                    msg.attachments
                        ? Promise.all(
                              msg.attachments.map(async (att) => ({
                                  id: att.id,
                                  name: att.name,
                                  url: await ctx.storage.getUrl(att.id),
                              }))
                          )
                        : Promise.resolve(undefined),
                ]);
                return {
                    ...msg,
                    image: imageUrl,
                    attachments: resolvedAttachments,
                    sender,
                };
            })
        );

        return {
            ...messages,
            page: messagesWithSender,
        };
    },
});

/**
 * Send a message in a direct conversation
 */
export const sendMessage = mutation({
    args: {
        conversationId: v.id("directConversations"),
        body: v.string(),
        image: v.optional(v.id("_storage")),
        attachments: v.optional(
            v.array(v.object({ id: v.id("_storage"), name: v.string() }))
        ),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Verify user is part of this conversation
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
            throw new Error("Not authorized to send messages in this conversation");
        }

        const receiverId = conversation.userOneId === userId ? conversation.userTwoId : conversation.userOneId;

        const messageId = await ctx.db.insert("directMessages", {
            body: args.body,
            image: args.image,
            attachments: args.attachments,
            senderId: userId,
            receiverId,
            conversationId: args.conversationId,
            createdAt: Date.now(),
        });

        // Update conversation last message time
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
        });

        return messageId;
    },
});

/**
 * Update read receipt for a conversation
 */
export const updateReadReceipt = mutation({
    args: {
        conversationId: v.id("directConversations"),
        lastReadMessageId: v.optional(v.id("directMessages")),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        // Verify user is part of this conversation
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
            throw new Error("Not authorized");
        }

        const existingReceipt = await ctx.db
            .query("directReadReceipts")
            .withIndex("by_user_conversation", (q) =>
                q.eq("userId", userId).eq("conversationId", args.conversationId)
            )
            .unique();

        if (existingReceipt) {
            await ctx.db.patch(existingReceipt._id, {
                lastReadAt: Date.now(),
                lastReadMessageId: args.lastReadMessageId,
            });
        } else {
            await ctx.db.insert("directReadReceipts", {
                userId,
                conversationId: args.conversationId,
                lastReadAt: Date.now(),
                lastReadMessageId: args.lastReadMessageId,
            });
        }

        return true;
    },
});

/**
 * Delete a conversation (and all its messages)
 */
export const deleteConversation = mutation({
    args: {
        conversationId: v.id("directConversations"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        if (conversation.userOneId !== userId && conversation.userTwoId !== userId) {
            throw new Error("Not authorized to delete this conversation");
        }

        // Delete all messages in the conversation
        const messages = await ctx.db
            .query("directMessages")
            .withIndex("by_conversation_id", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        // Delete read receipts
        const readReceipts = await ctx.db
            .query("directReadReceipts")
            .withIndex("by_conversation_id", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        for (const receipt of readReceipts) {
            await ctx.db.delete(receipt._id);
        }

        // Delete the conversation
        await ctx.db.delete(args.conversationId);

        return true;
    },
});

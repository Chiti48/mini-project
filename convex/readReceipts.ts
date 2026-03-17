import { v } from "convex/values";
import { mutation, query,QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

// ปรับปรุงจาก ctx: any เป็น ctx: QueryCtx (ใช้ได้ทั้ง Query และ Mutation)
const getMember = async (
    ctx: QueryCtx, 
    workspaceId: Id<"workspaces">, 
    userId: Id<"users">
  ) => {
    return await ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) => 
            q.eq("workspaceId", workspaceId).eq("userId", userId)
        )
        .unique();
};

export const markChannelAsRead = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const member = await getMember(ctx, channel.workspaceId, userId);
    if (!member) throw new Error("Member not found");

    const existingReceipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_member_id_channel_id", (q) => 
        q.eq("memberId", member._id).eq("channelId", args.channelId)
      )
      .unique();

    const currentTime = Date.now();

    if (existingReceipt) {
      await ctx.db.patch(existingReceipt._id, { lastReadAt: currentTime });
    } else {
      await ctx.db.insert("readReceipts", {
        workspaceId: channel.workspaceId, // เก็บไว้ด้วยเพื่อช่วยตอนนับยอดรวม
        memberId: member._id,
        channelId: args.channelId,
        lastReadAt: currentTime,
      });
    }
    return currentTime;
  },
});

export const getUnreadCount = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const channel = await ctx.db.get(args.channelId);
    if (!channel) return 0;

    const member = await getMember(ctx, channel.workspaceId, userId);
    if (!member) return 0;

    const readReceipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_member_id_channel_id", (q) => 
        q.eq("memberId", member._id).eq("channelId", args.channelId)
      )
      .unique();

    const lastReadAt = readReceipt?.lastReadAt || 0;

    // ประสิทธิภาพดีกว่า: ให้ฐานข้อมูลกรองเวลาให้เลย
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .filter((q) => q.gt(q.field("_creationTime"), lastReadAt))
      .collect();

    return unreadMessages.filter(msg => msg.memberId !== member._id).length;
  },
});

export const markConversationAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const member = await getMember(ctx, conversation.workspaceId, userId);
    if (!member) throw new Error("Member not found");

    const existingReceipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_member_id_conversation_id", (q) => 
        q.eq("memberId", member._id).eq("conversationId", args.conversationId)
      )
      .unique();

    const currentTime = Date.now();

    if (existingReceipt) {
      await ctx.db.patch(existingReceipt._id, { lastReadAt: currentTime });
    } else {
      await ctx.db.insert("readReceipts", {
        workspaceId: conversation.workspaceId,
        memberId: member._id,
        conversationId: args.conversationId,
        lastReadAt: currentTime,
      });
    }
    return currentTime;
  },
});

export const getConversationUnreadCount = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return 0;

    const member = await getMember(ctx, conversation.workspaceId, userId);
    if (!member) return 0;

    const readReceipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_member_id_conversation_id", (q) => 
        q.eq("memberId", member._id).eq("conversationId", args.conversationId)
      )
      .unique();

    const lastReadAt = readReceipt?.lastReadAt || 0;

    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("_creationTime"), lastReadAt))
      .collect();

    return unreadMessages.filter(msg => msg.memberId !== member._id).length;
  },
});

export const getTotalUnreadCount = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const member = await getMember(ctx, args.workspaceId, userId);
    if (!member) return 0;

    // ดึงยอดรวมจากทุกช่องในครั้งเดียว
    const unreadCounts = await ctx.db
      .query("readReceipts")
      .withIndex("by_workspace_member", (q) => 
        q.eq("workspaceId", args.workspaceId).eq("memberId", member._id)
      )
      .collect();

    let total = 0;
    for (const receipt of unreadCounts) {
        let messages;
        if (receipt.channelId) {
            messages = await ctx.db
                .query("messages")
                .withIndex("by_channel_id", (q) => q.eq("channelId", receipt.channelId))
                .filter((q) => q.gt(q.field("_creationTime"), receipt.lastReadAt))
                .collect();
        } else if (receipt.conversationId) {
            messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation_id", (q) => q.eq("conversationId", receipt.conversationId))
                .filter((q) => q.gt(q.field("_creationTime"), receipt.lastReadAt))
                .collect();
        }
        if (messages) {
            total += messages.filter(m => m.memberId !== member._id).length;
        }
    }

    return total;
  },
});
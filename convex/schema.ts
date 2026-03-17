import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
    ...authTables,
    workspaces: defineTable({
        name: v.string(),
        userId: v.id("users"),
        joinCode: v.string(),
    }),
    members: defineTable({
        userId: v.id("users"),
        workspaceId: v.id("workspaces"),
        role: v.union(v.literal("admin"), v.literal("member"))
    })
        .index("by_user_id", ["userId"])
        .index("by_workspace_id", ["workspaceId"])
        .index("by_workspace_id_user_id", ["workspaceId", "userId"]),
    channels: defineTable({
        name: v.string(),
        workspaceId: v.id("workspaces")
    })
        .index("by_workspace_id", ["workspaceId"]),
    conversations: defineTable({
        workspaceId: v.id("workspaces"),
        memberOneId: v.id("members"),
        memberTwoId: v.id("members"),
    })
        .index("by_workspace_id", ["workspaceId"]),
    messages: defineTable({
        body: v.string(),
        image: v.optional(v.id("_storage")),
        memberId: v.id("members"),
        workspaceId: v.id("workspaces"),
        channelId: v.optional(v.id("channels")),
        parentMessageId: v.optional(v.id("messages")),
        conversationId: v.optional(v.id("conversations")),
        updatedAt: v.optional(v.number()),
    })
        .index("by_workspace_id", ["workspaceId"])
        .index("by_member_id", ["memberId"])
        .index("by_channel_id", ["channelId"])
        .index("by_conversation_id", ["conversationId"])
        .index("by_parent_message_id", ["parentMessageId"])
        .index("by_channel_id_parent_message_id_conversation_id", [
            "channelId",
            "parentMessageId",
            "conversationId",
        ]),
    reactions: defineTable({
        workspaceId: v.id("workspaces"),
        messageId: v.id("messages"),
        memberId: v.id("members"),
        value: v.string(),
    })
        .index("by_workspace_id", ["workspaceId"])
        .index("by_message_id", ["messageId"])
        .index("by_member_id", ["memberId"]),
    readReceipts: defineTable({
        workspaceId: v.id("workspaces"),
        memberId: v.id("members"),
        channelId: v.optional(v.id("channels")),
        conversationId: v.optional(v.id("conversations")),
        lastReadAt: v.number(),
    })
        .index("by_member_id_channel_id", ["memberId", "channelId"])
        .index("by_member_id_conversation_id", ["memberId", "conversationId"])
        .index("by_workspace_member", ["workspaceId", "memberId"]) // สำหรับนับยอดรวม
        .index("by_member_id", ["memberId"]),
    // Task Board Tables
    taskBoards: defineTable({
        workspaceId: v.id("workspaces"),
        name: v.string(),
        description: v.optional(v.string()),
    })
        .index("by_workspace_id", ["workspaceId"]),
    taskLists: defineTable({
        boardId: v.id("taskBoards"),
        name: v.string(),
        order: v.number(), // For ordering lists on the board
    })
        .index("by_board_id", ["boardId"]),
    taskCards: defineTable({
        listId: v.id("taskLists"),
        title: v.string(),
        description: v.optional(v.string()),
        assigneeId: v.optional(v.id("members")),
        dueDate: v.optional(v.number()), // Timestamp
        labels: v.optional(v.array(v.string())),
        attachments: v.optional(v.array(v.id("_storage"))),
        order: v.number(), // For ordering cards within a list
        createdBy: v.id("members"),
        workspaceId: v.id("workspaces"),
    })
        .index("by_list_id", ["listId"])
        .index("by_workspace_id", ["workspaceId"])
        .index("by_assignee_id", ["assigneeId"]),
    taskComments: defineTable({
        taskId: v.id("taskCards"),
        memberId: v.id("members"),
        content: v.string(),
        workspaceId: v.id("workspaces"),
    })
        .index("by_task_id", ["taskId"])
        .index("by_workspace_id", ["workspaceId"]),
    taskActivityLogs: defineTable({
        taskId: v.id("taskCards"),
        memberId: v.id("members"),
        action: v.string(), // e.g., "created", "moved", "updated", "commented"
        details: v.optional(v.string()),
        fromListId: v.optional(v.id("taskLists")),
        toListId: v.optional(v.id("taskLists")),
        workspaceId: v.id("workspaces"),
    })
        .index("by_task_id", ["taskId"])
        .index("by_workspace_id", ["workspaceId"])
        .index("by_member_id", ["memberId"]),
});

export default schema;
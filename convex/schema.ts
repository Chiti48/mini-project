import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
    ...authTables,
    
    // ==========================================
    // Core Workspace Tables
    // ==========================================
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

    // ==========================================
    // Messaging Tables
    // ==========================================
    messages: defineTable({
        body: v.string(),
        image: v.optional(v.id("_storage")),
        // 🟢 อัปเกรด: เก็บเป็น Object เพื่อให้จำชื่อไฟล์ต้นฉบับได้
        attachments: v.optional(
            v.array(
                v.object({
                    id: v.id("_storage"),
                    name: v.string(),
                })
            )
        ),
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
        .index("by_workspace_member", ["workspaceId", "memberId"])
        .index("by_member_id", ["memberId"]),

    // ==========================================
    // Task Management (Kanban) Tables
    // ==========================================
    taskBoards: defineTable({
        workspaceId: v.id("workspaces"),
        name: v.string(),
        description: v.optional(v.string()),
    })
        .index("by_workspace_id", ["workspaceId"]),
        
    taskLists: defineTable({
        boardId: v.id("taskBoards"),
        name: v.string(),
        order: v.number(),
    })
        .index("by_board_id", ["boardId"]),
        
    taskCards: defineTable({
        listId: v.id("taskLists"),
        title: v.string(),
        description: v.optional(v.string()),
        assigneeId: v.optional(v.id("members")),
        dueDate: v.optional(v.number()),
        labels: v.optional(v.array(v.string())),
        // 🟢 อัปเกรด: เก็บชื่อไฟล์ของการ์ดงานด้วยเช่นกัน
        attachments: v.optional(
            v.array(
                v.object({
                    id: v.id("_storage"),
                    name: v.string(),
                })
            )
        ),
        order: v.number(),
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
        action: v.string(), 
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
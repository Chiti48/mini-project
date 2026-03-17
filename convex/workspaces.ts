import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

const generateCode = () => {
    const code = Array.from(
        { length: 6 },
        () => "0123456789abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 36)]
    ).join("");

    return code;
};

export const join = mutation({
    args: {
        joinCode: v.string(),
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }
        const workspace = await ctx.db.get(args.workspaceId);

        if (!workspace) {
            throw new Error("Workspace not found")
        }
        if (workspace.joinCode !== args.joinCode.toLowerCase()) {
            throw new Error("Invalid join code");
        }

        const existingMember = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();

        if (existingMember) {
            throw new Error("Already an member of this workspace");
        }

        await ctx.db.insert("members", {
            userId,
            workspaceId: workspace._id,
            role: "member",
        });
        return workspace._id;
    },
})

export const newJoinCode = mutation({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();

        if (!member || member.role !== "admin") {
            throw new Error("Unautorized");
        }
        const joinCode = generateCode();

        await ctx.db.patch(args.workspaceId, {
            joinCode,
        });

        return args.workspaceId;
    },
});

export const create = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        const joinCode = generateCode();

        const workspaceId = await ctx.db.insert("workspaces", {
            name: args.name,
            userId,
            joinCode,
        });

        await ctx.db.insert("members", {
            userId,
            workspaceId,
            role: "admin"
        });

        await ctx.db.insert("channels", {
            name: "general",
            workspaceId,

        })

        return workspaceId;
    },
});
export const get = query({
    args: {},
    handler: async (ctx) => {

        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return [];
        }

        const members = await ctx.db
            .query("members")
            .withIndex("by_user_id", (q) => q.eq("userId", userId))
            .collect();

        const workspaceIds = members.map((member) => member.workspaceId);

        const workspaces = [];

        for (const workspaceId of workspaceIds) {
            const workspace = await ctx.db.get(workspaceId);

            if (workspace) {
                workspaces.push(workspace);
            }
        }
        return workspaces;
    },
});

export const getInfoById = query({
    args: {
        id: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return null;
        }
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.id).eq("userId", userId),
            )
            .unique();

        const workspace = await ctx.db.get(args.id);

        return {
            name: workspace?.name,
            isMember: !!member,
        };
    },
});

export const getById = query({
    args: {
        id: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.id).eq("userId", userId),
            )
            .unique();

        if (!member) {
            return null;
        }

        return await ctx.db.get("workspaces", args.id);
    },
});

export const update = mutation({
    args: {
        id: v.id("workspaces"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.id).eq("userId", userId),
            )
            .unique();

        if (!member || member.role !== "admin") {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(args.id, {
            name: args.name
        });
        return args.id;
    },
});

export const remove = mutation({
    args: {
        id: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }
        
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.id).eq("userId", userId),
            )
            .unique();

        if (!member || member.role !== "admin") {
            throw new Error("Unauthorized");
        }

        // 1. ดึงข้อมูลตารางหลักที่เชื่อมกับ workspaceId โดยตรงผ่าน Promise.all
        const [
            members, 
            channels, 
            conversations, 
            messages, 
            reactions,
            taskBoards,      // จาก Schema ของคุณ
            taskCards,       // จาก Schema ของคุณ
            taskComments,    // จาก Schema ของคุณ
            taskActivityLogs // จาก Schema ของคุณ (แก้ชื่อจาก activityLogs)
        ] = await Promise.all([
            ctx.db.query("members").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            ctx.db.query("channels").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            ctx.db.query("conversations").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            ctx.db.query("messages").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            ctx.db.query("reactions").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            
            // Task Board Tables ที่มี workspaceId
            ctx.db.query("taskBoards").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            ctx.db.query("taskCards").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            ctx.db.query("taskComments").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
            ctx.db.query("taskActivityLogs").withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)).collect(),
        ]);

        // 2. ลบข้อมูลจากตารางหลักและ Messages
        for (const m of members) await ctx.db.delete(m._id);
        for (const c of channels) await ctx.db.delete(c._id);
        for (const conv of conversations) await ctx.db.delete(conv._id);
        for (const msg of messages) await ctx.db.delete(msg._id);
        for (const r of reactions) await ctx.db.delete(r._id);

        // 3. จัดการลบข้อมูลระบบ Task Board
        
        // ลบ Cards, Comments, Activity Logs (เพราะมี workspaceId ดึงมาแล้ว)
        for (const card of taskCards) await ctx.db.delete(card._id);
        for (const comment of taskComments) await ctx.db.delete(comment._id);
        for (const log of taskActivityLogs) await ctx.db.delete(log._id);

        // จัดการลบ taskLists (เพราะไม่มี workspaceId ต้องหาผ่าน boardId)
        for (const board of taskBoards) {
            // ดึง list ทั้งหมดที่อยู่ในบอร์ดนี้ แล้วลบทิ้ง
            const listsInBoard = await ctx.db
                .query("taskLists")
                .withIndex("by_board_id", (q) => q.eq("boardId", board._id))
                .collect();
                
            for (const list of listsInBoard) {
                await ctx.db.delete(list._id);
            }
            
            // ลบบอร์ดทิ้งหลังสุด
            await ctx.db.delete(board._id);
        }

        // 4. ลบ Workspace เป็นลำดับสุดท้าย
        await ctx.db.delete(args.id);

        return args.id;
    },
});
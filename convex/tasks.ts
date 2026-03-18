import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

// Helper functions
const getMember = async (
    ctx: QueryCtx,
    workspaceId: Id<"workspaces">,
    userId: Id<"users">
) => {
    return ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) =>
            q.eq("workspaceId", workspaceId).eq("userId", userId)
        )
        .unique();
};

const populateMember = (ctx: QueryCtx, memberId: Id<"members">) => {
    return ctx.db.get(memberId);
};

const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
    return ctx.db.get(userId);
};

const populateList = (ctx: QueryCtx, listId: Id<"taskLists">) => {
    return ctx.db.get(listId);
};

// Activity Log helper
const logActivity = async (
    ctx: MutationCtx,
    params: {
        taskId: Id<"taskCards">;
        memberId: Id<"members">;
        action: string;
        details?: string;
        fromListId?: Id<"taskLists">;
        toListId?: Id<"taskLists">;
        workspaceId: Id<"workspaces">;
    }
) => {
    await ctx.db.insert("taskActivityLogs", {
        taskId: params.taskId,
        memberId: params.memberId,
        action: params.action,
        details: params.details,
        fromListId: params.fromListId,
        toListId: params.toListId,
        workspaceId: params.workspaceId,
    });
};

// ========== TASK BOARDS ==========

export const createBoard = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        name: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const member = await getMember(ctx, args.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        const boardId = await ctx.db.insert("taskBoards", {
            workspaceId: args.workspaceId,
            name: args.name,
            description: args.description,
        });

        // Create default lists
        await ctx.db.insert("taskLists", {
            boardId,
            name: "To Do",
            order: 0,
        });
        await ctx.db.insert("taskLists", {
            boardId,
            name: "In Progress",
            order: 1,
        });
        await ctx.db.insert("taskLists", {
            boardId,
            name: "Done",
            order: 2,
        });

        return boardId;
    },
});

export const getBoards = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const member = await getMember(ctx, args.workspaceId, userId);
        if (!member) return [];

        const boards = await ctx.db
            .query("taskBoards")
            .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        return boards;
    },
});

export const getBoardById = query({
    args: {
        boardId: v.id("taskBoards"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const board = await ctx.db.get(args.boardId);
        if (!board) return null;

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member) return null;

        return board;
    },
});

// ========== TASK LISTS ==========

export const createList = mutation({
    args: {
        boardId: v.id("taskBoards"),
        name: v.string(),
        order: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const board = await ctx.db.get(args.boardId);
        if (!board) throw new Error("Board not found");

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        const listId = await ctx.db.insert("taskLists", {
            boardId: args.boardId,
            name: args.name,
            order: args.order,
        });

        return listId;
    },
});

export const getLists = query({
    args: {
        boardId: v.id("taskBoards"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const board = await ctx.db.get(args.boardId);
        if (!board) return [];

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member) return [];

        const lists = await ctx.db
            .query("taskLists")
            .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
            .order("asc")
            .collect();

        return lists;
    },
});

export const updateList = mutation({
    args: {
        listId: v.id("taskLists"),
        name: v.optional(v.string()),
        order: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const list = await ctx.db.get(args.listId);
        if (!list) throw new Error("List not found");

        const board = await ctx.db.get(list.boardId);
        if (!board) throw new Error("Board not found");

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        const update: Partial<Doc<"taskLists">> = {};
        if (args.name !== undefined) update.name = args.name;
        if (args.order !== undefined) update.order = args.order;

        await ctx.db.patch(args.listId, update);
        return args.listId;
    },
});

export const removeList = mutation({
    args: {
        listId: v.id("taskLists"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const list = await ctx.db.get(args.listId);
        if (!list) throw new Error("List not found");

        const board = await ctx.db.get(list.boardId);
        if (!board) throw new Error("Board not found");

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member || member.role !== "admin") throw new Error("Unauthorized");

        // Delete all cards in the list
        const cards = await ctx.db
            .query("taskCards")
            .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
            .collect();

        for (const card of cards) {
            await ctx.db.delete(card._id);
        }

        await ctx.db.delete(args.listId);
        return args.listId;
    },
});

// ========== TASK CARDS ==========

export const createCard = mutation({
    args: {
        listId: v.id("taskLists"),
        title: v.string(),
        description: v.optional(v.string()),
        assigneeId: v.optional(v.id("members")),
        dueDate: v.optional(v.number()),
        labels: v.optional(v.array(v.string())),
        attachments: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const list = await ctx.db.get(args.listId);
        if (!list) throw new Error("List not found");

        const board = await ctx.db.get(list.boardId);
        if (!board) throw new Error("Board not found");

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        // Get max order for cards in this list
        const existingCards = await ctx.db
            .query("taskCards")
            .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
            .collect();

        const maxOrder = existingCards.length > 0
            ? Math.max(...existingCards.map(c => c.order))
            : -1;

        const cardId = await ctx.db.insert("taskCards", {
            listId: args.listId,
            title: args.title,
            description: args.description,
            assigneeId: args.assigneeId,
            dueDate: args.dueDate,
            labels: args.labels,
            attachments: args.attachments,
            order: maxOrder + 1,
            createdBy: member._id,
            workspaceId: board.workspaceId,
        });

        // Log activity
        await logActivity(ctx, {
            taskId: cardId,
            memberId: member._id,
            action: "created",
            details: `Created task "${args.title}"`,
            workspaceId: board.workspaceId,
        });

        return cardId;
    },
});

export const getCards = query({
    args: {
        listId: v.id("taskLists"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const list = await ctx.db.get(args.listId);
        if (!list) return [];

        const board = await ctx.db.get(list.boardId);
        if (!board) return [];

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member) return [];

        const cards = await ctx.db
            .query("taskCards")
            .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
            .order("asc")
            .collect();

        // Populate assignee info
        const populatedCards = [];
        for (const card of cards) {
            let assignee = null;
            if (card.assigneeId) {
                const assigneeMember = await populateMember(ctx, card.assigneeId);
                if (assigneeMember) {
                    assignee = await populateUser(ctx, assigneeMember.userId);
                }
            }

            populatedCards.push({
                ...card,
                assignee,
            });
        }

        return populatedCards;
    },
});

export const getCardById = query({
    args: {
        cardId: v.id("taskCards"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;

        const card = await ctx.db.get(args.cardId);
        if (!card) return null;

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) return null;

        const list = await populateList(ctx, card.listId);
        let assignee = null;
        if (card.assigneeId) {
            const assigneeMember = await populateMember(ctx, card.assigneeId);
            if (assigneeMember) {
                assignee = await populateUser(ctx, assigneeMember.userId);
            }
        }

        const creatorMember = await populateMember(ctx, card.createdBy);
        const creator = creatorMember ? await populateUser(ctx, creatorMember.userId) : null;

        // Get attachment URLs
        const attachments = card.attachments
            ? await Promise.all(
                card.attachments.map(async (storageId) => ({
                    storageId,
                    url: await ctx.storage.getUrl(storageId),
                }))
            )
            : undefined;

        return {
            ...card,
            list,
            assignee,
            creator,
            attachments,
        };
    },
});

export const updateCard = mutation({
    args: {
        cardId: v.id("taskCards"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        assigneeId: v.optional(v.union(v.id("members"), v.literal("__CLEAR__"))),
        dueDate: v.optional(v.union(v.number(), v.literal("__CLEAR__"))),
        labels: v.optional(v.array(v.string())),
        attachments: v.optional(v.array(v.id("_storage"))),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        const update: Partial<Doc<"taskCards">> = {};
        const actionDetails: string[] = [];

        if (args.title !== undefined) {
            update.title = args.title;
            actionDetails.push(`changed title to "${args.title}"`);
        }
        if (args.description !== undefined) {
            update.description = args.description;
            actionDetails.push("updated description");
        }
        // Handle clearing optional fields explicitly
        if (args.assigneeId === "__CLEAR__") {
            update.assigneeId = undefined; // Clear the field
            actionDetails.push("removed assignee");
        } else if (args.assigneeId !== undefined) {
            update.assigneeId = args.assigneeId;
            const assigneeMember = await populateMember(ctx, args.assigneeId);
            const assigneeUser = assigneeMember ? await populateUser(ctx, assigneeMember.userId) : null;
            actionDetails.push(`assigned to ${assigneeUser?.name || "someone"}`);
        }
        if (args.dueDate === "__CLEAR__") {
            update.dueDate = undefined; // Clear the field
            actionDetails.push("removed due date");
        } else if (args.dueDate !== undefined) {
            update.dueDate = args.dueDate;
            actionDetails.push(`set due date to ${new Date(args.dueDate).toLocaleDateString()}`);
        }
        if (args.labels !== undefined) {
            update.labels = args.labels;
            actionDetails.push("updated labels");
        }
        if (args.attachments !== undefined) {
            update.attachments = args.attachments;
            actionDetails.push("updated attachments");
        }

        await ctx.db.patch(args.cardId, update);

        // Log activity
        if (actionDetails.length > 0) {
            await logActivity(ctx, {
                taskId: args.cardId,
                memberId: member._id,
                action: "updated",
                details: actionDetails.join(", "),
                workspaceId: card.workspaceId,
            });
        }

        return args.cardId;
    },
});

export const moveCard = mutation({
    args: {
        cardId: v.id("taskCards"),
        toListId: v.id("taskLists"),
        newOrder: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        const fromList = await ctx.db.get(card.listId);
        const toList = await ctx.db.get(args.toListId);
        if (!toList) throw new Error("Destination list not found");

        const fromListId = card.listId;

        await ctx.db.patch(args.cardId, {
            listId: args.toListId,
            order: args.newOrder,
        });

        // Log activity
        await logActivity(ctx, {
            taskId: args.cardId,
            memberId: member._id,
            action: "moved",
            details: `Moved from "${fromList?.name || "unknown"}" to "${toList.name}"`,
            fromListId,
            toListId: args.toListId,
            workspaceId: card.workspaceId,
        });

        return args.cardId;
    },
});

export const removeCard = mutation({
    args: {
        cardId: v.id("taskCards"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        // Delete all comments
        const comments = await ctx.db
            .query("taskComments")
            .withIndex("by_task_id", (q) => q.eq("taskId", args.cardId))
            .collect();

        for (const comment of comments) {
            await ctx.db.delete(comment._id);
        }

        // Delete all activity logs
        const logs = await ctx.db
            .query("taskActivityLogs")
            .withIndex("by_task_id", (q) => q.eq("taskId", args.cardId))
            .collect();

        for (const log of logs) {
            await ctx.db.delete(log._id);
        }

        // Log activity before deleting
        await logActivity(ctx, {
            taskId: args.cardId,
            memberId: member._id,
            action: "deleted",
            details: `Deleted task "${card.title}"`,
            workspaceId: card.workspaceId,
        });

        await ctx.db.delete(args.cardId);
        return args.cardId;
    },
});

export const copyCard = mutation({
    args: {
        cardId: v.id("taskCards"),
        listId: v.id("taskLists"),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.cardId);
        if (!card) throw new Error("Card not found");

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        const list = await ctx.db.get(args.listId);
        if (!list) throw new Error("List not found");

        // Get current max order in the list
        const existingCards = await ctx.db
            .query("taskCards")
            .withIndex("by_list_id", (q) => q.eq("listId", args.listId))
            .collect();
        
        const maxOrder = existingCards.length > 0
            ? Math.max(...existingCards.map(c => c.order))
            : -1;

        // Create the copied card
        const newCardId = await ctx.db.insert("taskCards", {
            workspaceId: card.workspaceId,
            listId: args.listId,
            title: args.title || `${card.title} (Copy)`,
            description: card.description,
            order: maxOrder + 1,
            assigneeId: card.assigneeId,
            dueDate: card.dueDate,
            labels: card.labels,
            attachments: card.attachments,
            createdBy: member._id,
        });

        // Log activity
        await logActivity(ctx, {
            taskId: newCardId,
            memberId: member._id,
            action: "copied",
            details: `Copied from "${card.title}"`,
            workspaceId: card.workspaceId,
        });

        return newCardId;
    },
});

// ========== TASK COMMENTS ==========

export const createComment = mutation({
    args: {
        taskId: v.id("taskCards"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const card = await ctx.db.get(args.taskId);
        if (!card) throw new Error("Card not found");

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        const commentId = await ctx.db.insert("taskComments", {
            taskId: args.taskId,
            memberId: member._id,
            content: args.content,
            workspaceId: card.workspaceId,
        });

        // Log activity
        await logActivity(ctx, {
            taskId: args.taskId,
            memberId: member._id,
            action: "commented",
            details: "Added a comment",
            workspaceId: card.workspaceId,
        });

        return commentId;
    },
});

export const getComments = query({
    args: {
        taskId: v.id("taskCards"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const card = await ctx.db.get(args.taskId);
        if (!card) return [];

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) return [];

        const comments = await ctx.db
            .query("taskComments")
            .withIndex("by_task_id", (q) => q.eq("taskId", args.taskId))
            .order("desc")
            .collect();

        // Populate member info
        const populatedComments = [];
        for (const comment of comments) {
            const commentMember = await populateMember(ctx, comment.memberId);
            const user = commentMember ? await populateUser(ctx, commentMember.userId) : null;

            populatedComments.push({
                ...comment,
                member: commentMember,
                user,
            });
        }

        return populatedComments;
    },
});

export const updateComment = mutation({
    args: {
        commentId: v.id("taskComments"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        const member = await getMember(ctx, comment.workspaceId, userId);
        if (!member || member._id !== comment.memberId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(args.commentId, {
            content: args.content,
        });

        return args.commentId;
    },
});

export const removeComment = mutation({
    args: {
        commentId: v.id("taskComments"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");

        const member = await getMember(ctx, comment.workspaceId, userId);
        if (!member || member._id !== comment.memberId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.commentId);
        return args.commentId;
    },
});

// ========== BOARDS ==========

export const removeBoard = mutation({
    args: {
        boardId: v.id("taskBoards"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const board = await ctx.db.get(args.boardId);
        if (!board) throw new Error("Board not found");

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member) throw new Error("Not a member of this workspace");

        // Check if user is admin (only admins can delete boards)
        if (member.role !== "admin") {
            throw new Error("Only admins can delete boards");
        }

        // Get all lists in this board
        const lists = await ctx.db
            .query("taskLists")
            .withIndex("by_board_id", (q) => q.eq("boardId", args.boardId))
            .collect();

        // Delete all cards in all lists
        for (const list of lists) {
            const cards = await ctx.db
                .query("taskCards")
                .withIndex("by_list_id", (q) => q.eq("listId", list._id))
                .collect();

            for (const card of cards) {
                // Delete comments
                const comments = await ctx.db
                    .query("taskComments")
                    .withIndex("by_task_id", (q) => q.eq("taskId", card._id))
                    .collect();

                for (const comment of comments) {
                    await ctx.db.delete(comment._id);
                }

                // Delete activity logs
                const logs = await ctx.db
                    .query("taskActivityLogs")
                    .withIndex("by_task_id", (q) => q.eq("taskId", card._id))
                    .collect();

                for (const log of logs) {
                    await ctx.db.delete(log._id);
                }

                // Delete card
                await ctx.db.delete(card._id);
            }

            // Delete list
            await ctx.db.delete(list._id);
        }

        // Delete board
        await ctx.db.delete(args.boardId);

        return args.boardId;
    },
});

export const updateBoard = mutation({
    args: {
        boardId: v.id("taskBoards"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // เพิ่มเช็คความยาวตรงนี้
        const trimmedName = args.name.trim();
        if (!trimmedName) {
            throw new Error("Board name cannot be empty");
        }

        const board = await ctx.db.get(args.boardId);
        if (!board) throw new Error("Board not found");

        const member = await getMember(ctx, board.workspaceId, userId);
        if (!member || member.role !== "admin") {
            throw new Error("Only admins can update boards");
        }

        // Update board name
        await ctx.db.patch(args.boardId, {
            name: trimmedName, // ใช้ตัวแปรที่ trim แล้ว
        });

        return args.boardId;
    },
});

// ========== ACTIVITY LOGS ==========

export const getActivityLogs = query({
    args: {
        taskId: v.id("taskCards"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];

        const card = await ctx.db.get(args.taskId);
        if (!card) return [];

        const member = await getMember(ctx, card.workspaceId, userId);
        if (!member) return [];

        const logs = await ctx.db
            .query("taskActivityLogs")
            .withIndex("by_task_id", (q) => q.eq("taskId", args.taskId))
            .order("desc")
            .collect();

        // Populate member info
        const populatedLogs = [];
        for (const log of logs) {
            const logMember = await populateMember(ctx, log.memberId);
            const user = logMember ? await populateUser(ctx, logMember.userId) : null;

            let fromList = null;
            let toList = null;
            if (log.fromListId) {
                fromList = await populateList(ctx, log.fromListId);
            }
            if (log.toListId) {
                toList = await populateList(ctx, log.toListId);
            }

            populatedLogs.push({
                ...log,
                member: logMember,
                user,
                fromList,
                toList,
            });
        }

        return populatedLogs;
    },
});

export const getWorkspaceActivityLogs = query({
    args: {
        workspaceId: v.id("workspaces"),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return { page: [], continueCursor: null, isDone: true };

        const member = await getMember(ctx, args.workspaceId, userId);
        if (!member) return { page: [], continueCursor: null, isDone: true };

        const logs = await ctx.db
            .query("taskActivityLogs")
            .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
            .order("desc")
            .paginate(args.paginationOpts);

        // Populate member and task info
        const populatedPage = [];
        for (const log of logs.page) {
            const logMember = await populateMember(ctx, log.memberId);
            const user = logMember ? await populateUser(ctx, logMember.userId) : null;
            const task = await ctx.db.get(log.taskId);

            // Populate list info for moved cards
            let fromList = null;
            let toList = null;
            if (log.fromListId) {
                fromList = await populateList(ctx, log.fromListId);
            }
            if (log.toListId) {
                toList = await populateList(ctx, log.toListId);
            }

            populatedPage.push({
                ...log,
                member: logMember,
                user,
                task,
                fromList,
                toList,
            });
        }

        return {
            ...logs,
            page: populatedPage,
        };
    },
});

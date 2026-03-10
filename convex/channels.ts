import { query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const get = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            return [];
        }

        // make sure the user is a member of the workspace
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();

        if (!member) {
            return [];
        }

        // return all channels for that workspace
        const channels = await ctx.db
            .query("channels")
            .withIndex("by_workspace_id", (q) =>
                q.eq("workspaceId", args.workspaceId)
            )
            .collect();

        return channels;
    },
});
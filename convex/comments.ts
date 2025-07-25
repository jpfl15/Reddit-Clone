import { mutation, query } from "./_generated/server";
import {v} from "convex/values"
import { getCurrentUserOrThrow } from "./users";
import { counts, commentCountKey } from "./counter";

export const create = mutation({
    args: {
        content: v.string(),
        postId: v.id("post")
    }, handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx)
        await ctx.db.insert("comments", {
            content: args.content,
            postId: args.postId,
            authorId: user._id
        });
        //grabs the key to increment it by one
        await counts.inc(ctx, commentCountKey(args.postId))
    },
})

export const getComments = query({
    args: {postId: v.id("post")},
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("comments")
            .withIndex("byPost", (q) => q.eq("postId", args.postId))
            .collect();
        
        //Set() is being used here to get all unique ids of users that have left a comment
        const authorIds = [...new Set(comments.map((comment) => comment.authorId))]
        //Maps over each authorId and fetches that user from the database using ctx.db.get(id).
        //Wraps it in Promise.all() to run all DB calls in parallel.
        const authors = await Promise.all(
            authorIds.map((id) => ctx.db.get(id))
        )
        //The ! after author is a TypeScript non-null assertion operator
        //It says: Trust me, this author is not null or undefined
        const authorMap = new Map(
            //This line is creating a Map (which is like a key-value dictionary).
            //Converts each user into a key-value pair: [id, username].
            authors.map(author => [author!._id, author!.username])
        )

        return comments.map((comment) => ({
            ...comment,
            author: {
                username: authorMap.get(comment.authorId)
            }
        }))
    },
});

//get the count of comments with a postId
export const getCommentCount = query({
    args: {postId: v.id("post")},
    handler: async (ctx, args) => {
        return await counts.count(ctx, commentCountKey(args.postId))
    }
})
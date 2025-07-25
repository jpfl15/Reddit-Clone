import {mutation, query, QueryCtx} from "./_generated/server"
import { ConvexError, v } from "convex/values"
import { getCurrentUserOrThrow } from "./users"
import { Doc, Id } from "./_generated/dataModel"
import { counts, postCountKey } from "./counter"
import { title } from "process"

//Omit is a typescript type
//This TypeScript type defines an "enriched" post structure by modifying an existing "post" document type while adding additional data.

//Doc<"post"> Represents the original Convex document for a "post".
//Omit<Doc<"post">, "subreddit"> Removes the "subreddit" field from the "post" document.
//here subreddit was removed to replace it with a costume structure
type EnrichedPost = Omit<Doc<"post">, "subreddit"> & {
    author: {username: string} | undefined
    subreddit: {
        _id: Id<"subreddit">;
        name: string;
    } | undefined
    imageUrl?: string
}

const ERROR_MESSAGES = {
    POST_NOT_FOUND: "Post not found",
    SUBREDDIT_NOT_FOUND: "Subreddit not found",
    UNAUTHORIZED_DELETE: "You can't delete this post"
} as const

export const create = mutation({
    args: {
        subject: v.string(),
        body: v.string(),
        subreddit: v.id("subreddit"),
        storageId: v.optional(v.id("_storage"))
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx)
        const postId = await ctx.db.insert("post", {
            subject: args.subject,
            body: args.body,
            subreddit: args.subreddit,
            authorId: user._id,
            image: args.storageId || undefined
        });
        await counts.inc(ctx, postCountKey(user._id))
        return postId
    }
});

async function getEnrichedPost(
    ctx: QueryCtx,
    post: Doc<"post">
): Promise<EnrichedPost> {
    //Uses Promise.all([...]) to fetch the author and subreddit simultaneously (faster than fetching one by one).
    const [author, subreddit] = await Promise.all([
        ctx.db.get(post.authorId),
        ctx.db.get(post.subreddit)
    ])
    //using a short-circuit evaluation to check if the post has an image
    //If yes, fetches the image URL using ctx.storage.getUrl(post.image).
    //post.image is an ID from _storage
    const image = post.image && await ctx.storage.getUrl(post.image)

    //returning the enriched post
    return {
        //Spreads (...post) the original post to keep all existing fields.
        ...post,
        //Adds the author field 
        author: author ? {username: author.username} : undefined,
        //Adds the subreddit field, always includes { _id, name }.
        subreddit: {
            _id: subreddit!._id,
            name: subreddit!.name
        },
        //Adds imageUrl
        imageUrl: image ?? undefined
    }
}

export async function getEnrichedPosts(
    ctx: QueryCtx,
    posts: Doc<"post">[]
): Promise<EnrichedPost[]> {
    return Promise.all(posts.map((post) => getEnrichedPost(ctx, post)));
}

export const getPost = query({
    args: {id: v.id("post")},
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id)
        if (!post) return null

        return getEnrichedPost(ctx, post)
    }
});

export const getSubredditPosts = query({
    args: { subredditName: v.string() },
    handler: async (ctx, args): Promise<EnrichedPost[]> => {
        //get the subreddit querying the subreddit table with the subredditName from the args 
        const subreddit = await ctx.db
            .query("subreddit")
            //.eq = equals
            .filter((q) => q.eq(q.field("name"), args.subredditName))
            .unique();
        
        if (!subreddit) return [];

        //using the subreddit's id, here's querying the post table
        //with .collect, collects all the elements of the query
        //here the query uses the index bySubreddit from the post schema
        const posts = await ctx.db
            .query("post")
            .withIndex("bySubreddit", (q) => q.eq("subreddit", subreddit._id))
            .collect();
        
        return getEnrichedPosts(ctx, posts)
    },
});

export const userPosts = query({
    args: { authorUserName: v.string() },
    handler: async (ctx, args): Promise<EnrichedPost[]> => {
        //get the subreddit querying the subreddit table with the subredditName from the args 
        const user = await ctx.db
            .query("users")
            //.eq = equals
            .filter((q) => q.eq(q.field("username"), args.authorUserName))
            .unique();
        
        if (!user) return [];

        const posts = await ctx.db
            .query("post")
            .withIndex("byAuthor", (q) => q.eq("authorId", user._id))
            .collect();
        
        return getEnrichedPosts(ctx, posts)
    },
});

export const deletePost = mutation({
    args: {id: v.id("post")},
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);
        if (!post) throw new ConvexError({message: ERROR_MESSAGES.POST_NOT_FOUND})
        
        const user = await getCurrentUserOrThrow(ctx)
        if (post.authorId !== user._id){
            throw new ConvexError({message: ERROR_MESSAGES.UNAUTHORIZED_DELETE})
        }
        await counts.dec(ctx, postCountKey(user._id))
        await ctx.db.delete(args.id)
    }
})

export const search = query({
    args: { queryStr: v.string(), subreddit: v.string() },
    handler: async (ctx, args) => {
        if(!args.queryStr) return [];

        const subredditObj = await ctx.db
            .query("subreddit")
            .filter((q) => q.eq(q.field("name"), args.subreddit))
            .unique();
        
        if (!subredditObj) return [];

        const posts = await ctx.db
            .query("post")
            .withSearchIndex("search_body", (q) =>
                //looking for all the posts that match the subject and also need to be in the same subreddit
                q.search("subject", args.queryStr).eq("subreddit", subredditObj._id)
            )
            .take(10);
        
        return posts.map(post => ({
            _id: post._id,
            title: post.subject,
            type: "post",
            name: subredditObj.name,
        }));
    },
})
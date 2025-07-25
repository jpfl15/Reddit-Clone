import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import {ConvexError, v} from "convex/values"
import { getEnrichedPosts } from "./post";

//for a mutation it is passed an object
//in the mutation is specified the arguments and a handler
export const create = mutation({
    //arguments to be passed to this mutation in order to create something
    args: {
        name: v.string(),
        description: v.optional(v.string())
    },
    //a handler is the function which will be called when the mutation is called
    //ctx is the context which gives things like the current user that's signed in
    handler: async(ctx, args) => {
        //this is to get the current user signed in and check if it exists on the database
        //a subreddit it can only be created by a user signed in
        const user = await getCurrentUserOrThrow(ctx)

        //this is to check that the user's not trying to create a subreddit with a name that already exists
        //query the subreddit table to get all the subreddits that exists
        const subreddits = await ctx.db.query("subreddit").collect()

        //if the subreddit's name already exists it throws an error
        if (subreddits.some((s) => s.name ===args.name)) {
            throw new ConvexError({message: "Subreddit already exists"})
        }

        //otherwise a new element is made
        await ctx.db.insert("subreddit", {
            name: args.name,
            description: args.description,
            //_id is a field that exists on all convex objects
            authorId: user._id
        })
    }
})

//a query is like a get request
//just like with mutations, a query needs arguments and a handler function
export const get = query({
    args: {name: v.string()},
    handler: async(ctx, args) => {
        //.eq = equals
        //compares the field "name" of the subreddit and the name of the arguments
        const subreddit = await ctx.db
            .query("subreddit")
            .filter((q) => q.eq(q.field("name"), args.name))
            .unique();
        
        if (!subreddit) return null

        //using the subreddit's id, here's querying the post table
        //with .collect, collects all the elements of the query
        //here the query uses the index bySubreddit from the post schema
        const posts = await ctx.db
            .query("post")
            .withIndex("bySubreddit", (q) => q.eq("subreddit", subreddit._id))
            .collect();

        const enrichedPosts = await getEnrichedPosts(ctx, posts)

        //... means use the properties of subreddit and then add a new one, in this case posts
        //essentially returning a new object that merges the data of the subreddit with its posts
        return {...subreddit, posts: enrichedPosts};
    },
});

export const search = query({
    args: { queryStr: v.string() },
    handler: async (ctx, args) => {
        if(!args.queryStr) return [];

        const subreddits = await ctx.db
            .query("subreddit")
            //the search() function allows to search and see if this query string applies to the subreddit name
            .withSearchIndex("search_body", (q) => q.search("name", args.queryStr))
            //the take() function means the query is gonna take a maximum of ten results
            .take(10);

        return subreddits.map((sub) => {
            return {...sub, type: "community", title: sub.name}
        })
    }
})
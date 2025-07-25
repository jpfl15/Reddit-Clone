import { defineSchema, defineTable } from "convex/server";
import {v} from "convex/values"

//In convex there are 3 main operation you can do
// 1. Query: get information and usually is displayed it on frontend
// 2. Mutation: Something to use when you create, delete or modify something in convex database
// 3. Action: Something that's typically used to call some kind of third party service
export default defineSchema({
    //In convex it's automatically inserted an ID and a created at time values anytime an instance is made in any table
    users: defineTable({
        username: v.string(),
        externalId: v.string(),
    })
        .index("byExternalId", ["externalId"])
        .index("byUsername", ["username"]),

    //convex supports full text search so it allows to use some bult in function
    //so using searchIndex() search through this content as efficiently as possible
    subreddit: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        authorId: v.id("users")
    }).searchIndex("search_body", {searchField: "name"}),

    post: defineTable({
        subject: v.string(),
        body: v.string(),
        subreddit: v.id("subreddit"),
        authorId: v.id("users"),
        //_storage is an internal location in convex that allows to store files (in this case images)
        image: v.optional(v.id("_storage"))
    })
        .searchIndex("search_body", {
            searchField: "subject", 
            filterFields: ["subreddit"]
        })
        .index("bySubreddit", ["subreddit"])
        .index("byAuthor", ["authorId"]),

    //in terms of fetching a ton of posts or comments (thousand rows of information)
    //the best practice is to use pagination
    //convex has built in pagination features but not used on this project
    comments: defineTable({
        content: v.string(),
        postId: v.id("post"),
        authorId: v.id("users")
    }).index("byPost", ["postId"]),

    downvote: defineTable({
        postId: v.id("post"),
        userId: v.id("users")
    })
        .index("byPost", ["postId"])
        .index("byUser", ["userId"]),

    upvote: defineTable({
        postId: v.id("post"),
        userId: v.id("users")
    })
        .index("byPost", ["postId"])
        .index("byUser", ["userId"]),
});
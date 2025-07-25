import { components } from "./_generated/api";
import { ShardedCounter } from "@convex-dev/sharded-counter";
import { Id } from "./_generated/dataModel";

//counter object
export const counts = new ShardedCounter(
    components.shardedCounter,
    {defaultShards: 1}
)

//each count have to be associated with a key

//this functions are to generate a unique key for each post, comment, upvote and downvote
//counts comments on a post
export function commentCountKey(postId: Id<"post">){
    return `comments:${postId}`
}

//counts posts of a user
export function postCountKey(userId: Id<"users">){
    return `post:${userId}`
}

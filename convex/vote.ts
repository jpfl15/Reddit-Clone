import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow, getCurrentUser } from "./users";
import { counts } from "./counter";

type VoteType = "upvote" | "downvote"

//returns a key that handles both up and down votes
export function voteKey(postId: string, voteType: VoteType): string {
    return `${voteType}:${postId}`
}

//function to toggle an upvote or a downvote
//either create or delete upvotes, create or delete downvotes
//rather than be a mutation this functions returns a mutation 
//to use it later to create separate function 
//for voting up, voting down, removeving the upvote and removing the downvote
export function createToggleVoteMutation(voteType: VoteType) {
    return mutation({
        args: { postId: v.id("post")},
        handler: async (ctx, args) => {
            const user = await getCurrentUserOrThrow(ctx)
            //if an upvote is created a dowvote must be removed and vice versa
            const oppositeVoteType: VoteType = voteType === "upvote" ? "downvote" : "upvote"

            //check if the user already voted
            //an user cannot upvote or downvote more than once
            const existingVote = await ctx.db
                .query(voteType)
                .withIndex("byPost", (q) => q.eq("postId", args.postId))
                .filter((q) => q.eq(q.field("userId"), user._id))
                .unique();

            //if the user upvote or downvote twice, the vote is removed
            if (existingVote) {
                await ctx.db.delete(existingVote._id)
                await counts.dec(ctx, voteKey(args.postId, voteType));
                return
            }

            const existingOppositeVote = await ctx.db
                .query(oppositeVoteType)
                .withIndex("byPost", (q) => q.eq("postId", args.postId))
                .filter((q) => q.eq(q.field("userId"), user._id))
                .unique();
            
            if (existingOppositeVote) {
                await ctx.db.delete(existingOppositeVote._id)
                await counts.dec(ctx, voteKey(args.postId, oppositeVoteType));
            }

            //insert the vote
            await ctx.db.insert(voteType, {
                postId: args.postId,
                userId: user._id
            })
            await counts.inc(ctx, voteKey(args.postId, voteType))
        },
    });
}

export function createHasVotedQuery(voteType: VoteType) {
    return query({
        args: {postId: v.id("post")},
        handler: async (ctx, args) => {
            const user = await getCurrentUser(ctx);
            if (!user) return false;

            const vote = await ctx.db
            .query(voteType)
            .withIndex("byPost", (q) => q.eq("postId", args.postId))
            .filter((q) => q.eq(q.field("userId"), user._id))
            .unique();

            //converts vote into a boolean
            //if exists is true and if not is false
            return !!vote
        },
    });
}

//this is to get the mutation for upvote and downvote for later use
export const toggleUpvote = createToggleVoteMutation("upvote")
export const toggleDownvote = createToggleVoteMutation("downvote")
export const hasUpvoted = createHasVotedQuery("upvote")
export const hasDownvoted = createHasVotedQuery("downvote")

//query to get the number of total votes which is upvotes - downvotes
export const getVoteCounts = query({
    args: { postId: v.id("post")},
    handler: async (ctx, args) =>{
        const upvotes = await counts.count(ctx,voteKey(args.postId, "upvote"))
        const downvotes = await counts.count(ctx,voteKey(args.postId, "downvote"))

        return {upvotes, downvotes, total: upvotes - downvotes };
    },
});
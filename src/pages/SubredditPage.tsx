import { useParams } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import PostCard from "../components/PostCard"
import "../styles/SubredditPage.css"

const SubredditPage = () => {
    //with useParams you can extract the parameter subredditName from App.tsx
    const {subredditName} = useParams()

    //this variable will be equal to undefined while the query is loading 
    //so when is undefined it means the page is currently loading
    const subreddit = useQuery(api.subreddit.get, {name: subredditName || ""})

    if (subreddit === undefined) return <p>Loading...</p>

    if (!subreddit) {
        return (
            <div className="content-container">
                <div className="not-found">
                    <h1>Subreddit not found</h1>
                    <p>The subreddit r/{subredditName} does not exist.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="content-container">
            <div className="subreddit-banner">
                <h1>r/{subreddit.name}</h1>
                {subreddit.description && <p>{subreddit.description}</p>}
            </div>
            <div className="posts-container">
                {/*the ? in .posts? is a optional chaining 
                is used to safely access properties or call functions 
                on possibly null or undefined values without throwing an error.
                */}
                {subreddit.posts?.length === 0 ? (
                    <div className="no-posts">
                        <p>No posts yet. Be the first to post</p>
                    </div>
                ) : (
                    //The .map() function is a built-in method in JavaScript for arrays.
                    //It takes an array and returns a new array where each item has been transformed using a function you provide.
                    //in this case for each post returns a PostCard component and give it a post prop containing the current post object

                    //in React, when you render a list of elements like this (e.g. with .map())
                    //React needs a unique key for each element to track them efficiently when updating the UI.
                    subreddit.posts?.map((post) => (
                        <PostCard key={post._id} post={post} />
                    ))
                )}
            </div>
        </div>
    );
};

export default SubredditPage
import { useParams } from "react-router-dom"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import PostCard from "../components/PostCard"
import "../styles/ProfilePage.css"

const ProfilePage = () => {
    const {username} = useParams()
    //this variable will be equal to undefined while the query is loading 
    //so when is undefined it means the page is currently loading
    const posts = useQuery(api.post.userPosts, {
        authorUserName: username || ""
    });

    const stats = useQuery(api.users.getPublicUser, {username: username || ""})

    if (posts === undefined) 
        return (
            <div className="content-container">
                <div className="profile-header">
                    <h1>u/{username}</h1>
                </div>
                <div className="loading">Loading posts...</div>
            </div>
        );

    return (
        <div className="content-container">
            <div className="profile-header">
                <h1>u/{username}</h1>
                <p style={{color: "#7c7c7c"}}>Posts: {stats?.posts ?? 0}</p>
            </div>

            <div className="posts-container">
                {posts.length === 0 ? (
                    <div className="no-post">
                        <p>No posts yet</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard key={post._id} post={post} showSubreddit={true}/>
                    ))
                )}
                
            </div>
        </div>
    );
};

export default ProfilePage
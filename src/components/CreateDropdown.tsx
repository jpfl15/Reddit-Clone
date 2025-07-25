import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import {useLocation, useNavigate,} from "react-router-dom"
import CreateCommunityModal from "./CreateCommunityModal"
import "../styles/CreateDropdown.css"

interface CreateDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

//Component
const CreateDropdown = ({isOpen, onClose}: CreateDropdownProps) => {
    const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false)
    {/* is for checking the url path */}
    const location = useLocation()
    {/* this is to change the page you're on */}
    const navigate = useNavigate()

    {/* /^\/r\/([^/]+)/ is to check if the url path have r/, in other words to check if the user is inside a subreddit */}
    const subredditMatch = location.pathname.match(/^\/r\/([^/]+)/)

    {/* if subredditMatch exists (there's a match), is going to give r/ and then give whatever comes afters r/ 
        so here if subredditMatch exists it's going to get the second element which contain the name of the subreddit
        otherwise is just null*/}
    const currentSubreddit = subredditMatch ? subredditMatch[1] : null;

    if (!isOpen) return null

    const handleCreatePost = () => {
        if (currentSubreddit) {
            navigate(`/r/${currentSubreddit}/submit`)
            onClose()
        }
    }

    const handleCreateCommunity = () => {
        setIsCommunityModalOpen(true)
    }

    return <>
        <div className="modal-overlay" onClick={onClose}></div>
        <div className="create-dropdown">
            <div className="dropdown-header">
                <h3>Create</h3>
            </div>
            <div className="dropdown-options">
                {currentSubreddit && (
                    <button className="dropdown-option" onClick={handleCreatePost}>
                        <div className="option-icon">
                            <FaPlus />
                        </div>
                        <div className="option-content">
                            <span className="option-title">Post</span>
                            <span className="option-description">Share to r/{currentSubreddit}</span>
                        </div>
                    </button>
                )}

                <button className="dropdown-option" onClick={handleCreateCommunity}>
                    <div className="option-icon">
                        <FaPlus />
                    </div>
                    <div className="option-content">
                        <span className="option-title">Community</span>
                        <span className="option-description">Create a new community</span>
                    </div>
                </button>
            </div>
        </div>
        
        {isCommunityModalOpen && (
            <CreateCommunityModal 
                isOpen= {isCommunityModalOpen}
                onClose={() => {
                    setIsCommunityModalOpen(false);
                    onClose();
                }}
            />
        )}
    </>
};

export default CreateDropdown

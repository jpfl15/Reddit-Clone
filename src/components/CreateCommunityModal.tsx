import { useState } from "react";
import { useMutation } from "convex/react";
import {api} from "../../convex/_generated/api";
import "../styles/CreateCommunityModal.css"

//An interface in TypeScript is a way to define the shape (structure) of an object. 
// It helps enforce type safety by specifying what properties and types an object should have.
interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void
}

const CreateCommunityModal = ({isOpen, onClose} : CreateCommunityModalProps) => {
    //Creates React State variables
    //A state variable in React is a piece of data that React tracks and updates inside a component 
    // When a state variable changes, React re-renders the component to reflect the new data
    //useState creates a state variable and initializes it with an empty string ("") 
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    //the api object from /_generated/api helps to access to the code, in this case to the create function of subreddit.ts
    //because convex backend is running and it's automatically updating and regenerating the API
    const createSubreddit = useMutation(api.subreddit.create)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
      //prevents the browser to reload the page when submiting a form
      e.preventDefault()
      setError("")

      if (!name){
        setError("Community name is required")
        return
      }

      if (name.length < 3 || name.length > 21){
        setError("Community name must be between 3 and 21 characters.")
        return
      }

      if (!/^[a-zA-Z0-9]+$/.test(name)){
        setError("Community name can only contain letters, numbers and underscores.")
        return
      }

      setIsLoading(true)
      //calls the createSubreddit function and pauses execution until the function resolves or rejects
      await createSubreddit({name, description})
        //if succeeds
        .then((result) => {
          console.log(result);
          onClose();
        })
        //if fails
        .catch((err) => {
          setError(`Failed to create community. ${err.data.message}`);
        })
        .finally(() => setIsLoading(false));
    };

    return (
      <>
        <div className="modal-overlay" onClick={onClose} />
        <div className="modal-container">
          <div className="modal-header">
            <h2>Create a Community</h2>
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <div className="input-prefix">r/</div>
              <input
                type="text"
                id="name"
                value={name}
                //e is an event object passed to the function onChange()
                //An event object is an object that contains information about an event that just happened 
                //(like a button click, form submission, or text input change).
                onChange={(e) => setName(e.target.value)}
                placeholder="community_name"
                maxLength={21}
                disabled={isLoading}
              />
              <p className="input-help">
                Community names including capitalization cannot be changed.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span>(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your community"
                maxLength={100}
                disabled={isLoading}
              ></textarea>
            </div>

            {/* this is a short-circuit evaluation
            Short-circuit evaluation is a logical operation optimization 
            where JavaScript stops evaluating an expression as soon as the result is determined. */}
            {error && <div className="error-message">{error}</div>}

            <div className="modal-folder">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-button"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Community"}
              </button>
            </div>
          </form>
        </div>
      </>
    );
};

export default CreateCommunityModal
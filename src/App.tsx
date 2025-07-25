import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import ProfilePage from "./pages/ProfilePage"
import SubredditPage from "./pages/SubredditPage"
import SubmitPage from "./pages/SubmitPage"
import PostPage from "./pages/PostPage"
import "./styles/App.css"

function App() {
  return <BrowserRouter>
    <Routes>
      {/* "/" is the parent route which renders the Layout component
          In Layout there's an Outlet which renders a child route */}
      <Route path="/" element={<Layout />}>
        {/* Because this route is index, when the user goes to "/" HomePage will be rendered */}
        <Route index element={<HomePage />}/>
        {/* : is for variable names*/}
        <Route path="r/:subredditName" element={<SubredditPage />}/>
        <Route path="r/:subredditName/Submit" element={<SubmitPage />}/>
        <Route path="u/:username" element={<ProfilePage />} />
        <Route path="post/:postId" element={<PostPage />}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>

      </Route>
    </Routes>
  </BrowserRouter>
}

export default App

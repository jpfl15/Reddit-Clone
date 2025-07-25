import {Outlet} from "react-router-dom"
import Navbar from "./Navbar"

const Layout = () => {
    return (
        <div className="app-container">
            <Navbar />
            <div className="main-content">
                {/* An Outlet renders the matching child route of a parent route or nothing if no match */}
                <Outlet />
            </div>
        </div>
    )
}

export default Layout
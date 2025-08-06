import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from 'react-router-dom'

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
                <Sidebar />
                <main className="p-6 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout
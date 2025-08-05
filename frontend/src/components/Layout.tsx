import Header from "./Header";
import Sidebar from "./Sidebar";
import { ReactNode } from 'react'

type LayoutProps = {
    children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div>
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="p-6 flex-1">{children}</main>
            </div>
        </div>
    )
}

export default Layout
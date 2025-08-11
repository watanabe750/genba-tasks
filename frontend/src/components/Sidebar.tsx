import { Link } from 'react-router-dom'

const Sidebar = () => {
    return (
        <aside className="bg-gray-100 w-64 min-h-screen p-4">
            <nav className="flex flex-col gap-4">
                <Link to="/tasks" className="hover:underline">タスク一覧</Link>
                <Link to="/summary" className="hover:underline">進捗サマリー</Link>
            </nav>
        </aside>
    )
}

export default Sidebar
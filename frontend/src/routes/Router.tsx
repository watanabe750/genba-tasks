import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import TaskList from '../pages/TaskList'
import Summany from '../pages/Summary'
import Layout from '../components/Layout'

export const AppRouter = () => {
    return (
        <BrowserRouter>
                <Routes>
                    {/* ログインページ Layoutなしページ */}
                    <Route path="/login" element={<Login />}/>

                    {/* Layout を使うページたち */}
                    <Route element={<Layout />}>
                    
                        <Route path="/tasks" element={<TaskList/>}/>
                        <Route path="/summary" element={<Summany/>}/>
                    </Route>
                </Routes>
        </BrowserRouter>
    )
}
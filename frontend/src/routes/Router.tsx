import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import TaskList from '../pages/TaskList'
import Summany from '../pages/Summary'

export const AppRouter = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/login" element={<Login />}/>
            <Route path="/tasks" element={<TaskList/>}/>
            <Route path="/summary" element={<Summany/>}/>
        </Routes>
    </BrowserRouter>
)
import { useEffect, useState } from "react";
import axios from 'axios'
import TaskItem from "../components/TaskItem";
import type { Task } from "../types/task";

const TaskList = () => {
    const [tasks, setTasks] = useState<Task[]>([])

    useEffect(() => {
        axios
            .get<Task[]>('http://localhost:3000/api/tasks')
            .then((res) => {
                setTasks(res.data)
            })
            .catch((err) => {
                console.error('タスク取得失敗:',err)
            })
    },[])

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">タスク一覧ページ</h1>
            {tasks.map((task) => (
                <TaskItem key={task.id} task={task}/>
            ))}
        </div>
    )
}

export default TaskList
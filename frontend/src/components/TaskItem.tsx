import type { Task } from "../types/task"

type TaskItemProps = {
    task: Task
}

const TaskItem = ({ task }: TaskItemProps) => {
    return (
        <div className="mb-4" style={{ paddingLeft: `${(task.depth - 1) * 20}px` }}>
            <h2 className="text-lx font-semibold">{task.title}</h2>
            <p>期限: {task.deadline || '未設定'}</p>
            <p>ステータス: {task.status}</p>

            <div className="w-full bg-gray-700 rounded-full h-4 mt-2">
                <div
                    className="bg-green-400 h-4 rounded-full"
                    style={{ width: `${task.progress}%` }}
                />
            </div>
            <p className="text-sm text-gray-300">{task.progress}%</p>

            {/* 再帰的に children を表示 */}
            {task.children.length > 0 && (
                <div>
                    {task.children.map((child: Task) => (
                        <TaskItem key={child.id} task={child} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default TaskItem
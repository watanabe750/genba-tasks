import type { Task } from "../types/task"

type TaskItemProps = {
    task: Task
};

const TaskItem = ({ task }: TaskItemProps) => {
    // depth未設定でもズレないように
    const depth = task.depth ?? 1;
    const indent = Math.max(0, (depth -1 ) * 20);
    
    // /api/tasks は children を返さない想定なので安全化
    const children = task.children ?? [];

    return (
        <div className="mb-4" style={{ paddingLeft: `${indent}px` }}>
            <h2 className="text-lg font-semibold">{task.title}</h2>
            <p>期限: {task.deadline ?? '未設定'}</p>
            <p>ステータス: {task.status}</p>

            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div
                    className="bg-gray-700 h-3 rounded-full"
                    style={{ width: `${task.progress}%` }}
                />
            </div>
            <p className="text-sm text-gray-600">{task.progress}%</p>

            {/* 再帰的に children を表示 */}
            {children.length > 0 && (
                <div className="mt-2">
                    {children.map((child) => (
                        <TaskItem key={child.id} task={child} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskItem
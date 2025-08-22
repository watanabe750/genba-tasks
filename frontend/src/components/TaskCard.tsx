type Task = {
    id: number;
    title: string;
    dueDate: string;
    status: string;
};

type Props = {
    task: Task;
    onToggleComplete: (id: number) => void; // 親から渡してもらう
};

const TaskCard = ({ task, onToggleComplete }: Props) => {
    const isCompleted = task.status === "completed";

    return (
        <div className="border rounded p-4 shadow-sm bg-white mb-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{task.title}</h2>

                {/* チェックボックス */}
                <label className="inline-flex items-center gap-1 text-sm">
                    <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => onToggleComplete(task.id)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        完了
                </label>
            </div>

            <p className="text-sm text-gray-600">期限: {task.dueDate}</p>
            <p className="text-sm text-gray-600">ステータス: {isCompleted ? "完了" : "未完了"}
                
            </p>
        </div>
    );
};

export default TaskCard
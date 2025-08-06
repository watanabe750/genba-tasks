type Task = {
    id: number;
    title: string;
    dueDate: string;
    status: string;
};

type Props = {
    task: Task;
};

const TaskCard = ({ task }: Props) => {
    return (
        <div className="border rounded p-4 shadow-sm bg-white mb-4">
            <h2 className="text-lg font-semibold">{task.title}</h2>
            <p className="text-sm text-gray-600">期限: {task.dueDate}</p>
            <p className="text-sm text-gray-600">ステータス: {task.status}</p>
        </div>
    );
};

export default TaskCard
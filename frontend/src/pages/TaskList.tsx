import TaskCard from "../components/TaskCard"

const TaskList = () => {
    const dummyTasks = [
        { id: 1, title: '工程会議の資料作成', dueDate: '2025-08-10', status: '未着手' },
        { id: 2, title: '現場写真の撮影', dueDate: '2025-08-06', status: '進行中'},
        { id: 3, title: '材料検収の報告書', dueDate: '2025-08-05', status: '完了'},
    ];

    return (
    <div>
        <h1 className="text-2xl font-bold mb-6">タスク一覧ページ</h1>
        {dummyTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
        ))}
    </div>
    );
};

export default TaskList;
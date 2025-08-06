export type Task = {
    id: number
    title: string
    deadline?: string | null
    status: string
    progress: number
    depth: number
    children: Task[]
}
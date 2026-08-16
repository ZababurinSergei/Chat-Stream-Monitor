interface Todo3 {
    title: string;
    description: string;
    completed: boolean;
}

type TodoPreview = Pick<Todo3, "title" | "completed">;

const todo3: TodoPreview = {
    title: "Clean room",
    completed: false,
};

todo3;
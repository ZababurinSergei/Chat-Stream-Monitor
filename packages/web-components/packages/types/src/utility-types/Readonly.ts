interface Todo2 {
    title: string;
}

const todo: Readonly<Todo2> = {
    title: "Delete inactive users",
};

// todo.title = "Hello";
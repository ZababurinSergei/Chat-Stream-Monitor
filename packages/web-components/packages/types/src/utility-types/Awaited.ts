type A = Awaited<Promise<string>>;
type B = Awaited<Promise<Promise<number>>>;
type C = Awaited<boolean | Promise<number>>;

// Тип A = string
function getString(): A {
    return "Hello, TypeScript!";
}

// Тип B = number
function getNumber(): B {
    return 42;
}

// Тип C = number | boolean
function getNumberOrBoolean(): C {
    if (Math.random() > 0.5) {
        return 100; // number
    } else {
        return false; // boolean
    }
}

const data: B = getNumber()

// Функция, возвращающая Promise<Promise<number>>
async function getDoublePromise(): Promise<Promise<number>> {
    // Создаем Promise, который резолвится в другой Promise
    return new Promise<Promise<number>>((resolve) => {
        resolve(Promise.resolve(999));
    });
}

// Пример получения B через await
async function getBFromDoublePromise(): Promise<B> {
    const doublePromise = await getDoublePromise();
    const number = await doublePromise;
    return number; // Тип: number (благодаря Awaited)
}

// Более простой вариант с вложенным Promise
async function getNestedPromise(): Promise<B> {
    // Просто возвращаем number - это уже будет B
    return 777;
}


async function demonstrateTypes() {
    const a: A = getString();
    console.log(a); // "Hello, TypeScript!"

    const b: B = getNumber();
    console.log(b); // 42

    const c: C = getNumberOrBoolean();
    console.log(c); // 100 или false

    // Получаем B из вложенного Promise
    const bFromPromise: B = await getNestedPromise();
    console.log(bFromPromise); // 777
}

// Еще один пример для типа C с Promise
async function getCWithPromise(): Promise<C> {
    if (Math.random() > 0.5) {
        // Возвращаем Promise<number>, который будет развернут в number
        return Promise.resolve(888);
    } else {
        // Возвращаем boolean
        return true;
    }
}

// Использование
demonstrateTypes();
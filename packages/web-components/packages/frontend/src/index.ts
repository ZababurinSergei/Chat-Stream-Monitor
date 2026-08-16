import './components/test-component-a';

interface AppContext {
    [key: string]: any[];
}

interface ComponentConfig {
    component: string;
    id: string;
    slot: string;
    attributes?: Record<string, string>;
}

const components: Record<string, any> = {};
let root: Element | undefined;
const context: AppContext = {};

// Интерфейс для виртуального CSS модуля
interface VirtualCSSModule {
    getCSSForComponent: (componentName: string) => string | null;
    getCSSByPath?: (filePath: string) => string | null;
    getAllCSS?: () => string;
    injectCSS?: () => void;
}

let cssModule: VirtualCSSModule | false = false;

// Функция для асинхронной загрузки CSS модуля
async function loadCSSModule(): Promise<void> {
    try {
        cssModule = await import('virtual:css') as VirtualCSSModule;
    } catch (e) {
        // console.warn('virtual:css не загружен');
    }
}

// Инициализация CSS модуля
let cssModuleInitialized = false;
async function ensureCSSModule(): Promise<void> {
    if (!cssModuleInitialized) {
        await loadCSSModule();
        cssModuleInitialized = true;
    }
}

// Создаем app отдельно от window.onload
const appInit = async (): Promise<any> => {
    // Убеждаемся, что CSS модуль загружен
    await ensureCSSModule();

    if (cssModule && cssModule.injectCSS) {
        cssModule.injectCSS();
    }

    const componentConfigs: ComponentConfig[] = [
        {
            component: 'test-component-a',
            id: 'test-component-a-1',
            slot: 'test-components'
        }
    ];

    for (const item of componentConfigs) {
        const isAttribute = item.hasOwnProperty('attributes');

        if (!context[item.component]) {
            context[item.component] = [];
        }

        const element = document.createElement(item.component);
        element.setAttribute('id', item.id);
        element.setAttribute('slot', item.slot);

        if (isAttribute && item.attributes) {
            for (const key in item.attributes) {
                const value = item.attributes[key];
                if (typeof value === 'string') {
                    element.setAttribute(key, value);
                }
            }
        }

        // Добавляем элемент в DOM перед вызовом connectedCallback
        if (!document.body.querySelector(`${item.component}[id="${item.id}"]`)) {
            document.body.appendChild(element);
        }

        // Ждем готовности компонента
        if ((element as any).connectedCallback) {
            await (element as any).connectedCallback();
        }

        if (context[item.component]) {
            context[item.component]!.push({ element });
        }

        if (!components[item.component]) {
            components[item.component] = {
                id: {
                    [item.id]: element
                }
            };
            root = root ? root : element;
        } else if (!components[item.component].id[item.id]) {
            components[item.component].id[item.id] = element;
            root = root ? root : element;
        } else {
            console.log('item', item);
            console.error('Duplicate component ID');
        }
    }

    setTimeout(async () => {
        document.documentElement.classList.add('visible');
    }, 1000);

    console.log('✅ All components initialized successfully');
    console.log('📊 Loaded components:', Object.keys(components));
    console.log('componentConfigs', components);
    return components;
};

// Инициализируем app
const app = appInit();

// Устанавливаем onload
window.onload = async () => {
    await app;
};

// Исправляем доступ к app через then
app.then(() => {
    globalThis.startTime = Date.now();
    globalThis.NODE_PORT = 6832;
});

export { app };
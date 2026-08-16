declare module 'virtual:css' {
    export function injectCSS(): void;
    export function getCSSForComponent(componentName: string): string | null;
    export function getCSSByPath(filePath: string): string | null;
    export function getAllCSS(): string;
}

declare global {
    var startTime: number;
    var NODE_PORT: number;

    interface Function {
        tagName?: string;
    }
}

export {};
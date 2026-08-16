declare module 'virtual:css' {
    export function injectCSS(): void;
    export function getCSSForComponent(componentName: string): string | null;
    export function getCSSByPath(filePath: string): string | null;
    export function getAllCSS(): string;
    export function getCSSPaths(): string[];
    export function getMultipleCSS(paths: string[]): string;
    export function getComponentCSSMap(): Record<string, string[]>;
}
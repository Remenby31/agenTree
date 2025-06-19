import { ToolFunction, ToolMetadata } from '../types';
export declare class ToolRegistry {
    private static tools;
    static register(name: string, func: ToolFunction): void;
    static get(name: string): ToolFunction | undefined;
    static getMetadata(name: string): ToolMetadata | undefined;
    static getAllMetadata(toolNames?: string[]): ToolMetadata[];
    static list(): string[];
    static clear(): void;
    static has(name: string): boolean;
}
//# sourceMappingURL=ToolRegistry.d.ts.map
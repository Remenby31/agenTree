import { TaskContext } from '../types';
export declare class Task {
    readonly name: string;
    readonly description: string;
    readonly context: TaskContext;
    readonly contextItems: string[];
    constructor(name: string, description: string, contextItems?: string[]);
    loadContext(): Promise<void>;
    getSystemPrompt(): string;
    getUserPrompt(): string;
}
//# sourceMappingURL=Task.d.ts.map
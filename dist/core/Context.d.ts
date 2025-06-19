import { TaskContext } from '../types';
export declare class Context {
    static loadContext(contextItems: string[]): Promise<TaskContext>;
    static formatContextForPrompt(context: TaskContext): string;
    private static isFilePath;
    private static isUrl;
    private static loadFile;
    private static fetchUrl;
}
//# sourceMappingURL=Context.d.ts.map
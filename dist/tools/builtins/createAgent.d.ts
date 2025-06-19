export interface CreateAgentParams {
    name: string;
    task: string;
    context?: string[];
    tools?: string[];
}
/**
 * Create a child agent to handle a specific subtask
 * @param name Name for the child agent
 * @param task Task description for the child agent
 * @param context Optional context (files, URLs, text) for the child agent
 * @param tools Optional list of tool names the child agent should have access to
 */
export declare function createAgent(params: CreateAgentParams): Promise<string>;
//# sourceMappingURL=createAgent.d.ts.map
import { AgentConfig, AgentResult } from '../types';
export declare class Agent {
    private readonly id;
    private readonly config;
    private readonly task;
    private readonly tools;
    private readonly llmClient;
    private readonly parentId?;
    private readonly depth;
    private messages;
    private children;
    private isCompleted;
    private result?;
    constructor(agentConfig: AgentConfig);
    execute(): Promise<AgentResult>;
    private executionStep;
    private handleToolCalls;
    private executeToolCall;
    private handleCreateAgent;
    private handleStopAgent;
    private getAvailableTools;
    private initializeBuiltinTools;
}
//# sourceMappingURL=Agent.d.ts.map
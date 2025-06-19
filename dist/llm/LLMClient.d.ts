import { LLMMessage, LLMResponse, LLMStreamChunk, ToolMetadata, AgentTreeConfig } from '../types';
export declare abstract class LLMClient {
    protected config: AgentTreeConfig;
    constructor(config: AgentTreeConfig);
    abstract chat(messages: LLMMessage[], tools?: ToolMetadata[], streaming?: boolean): Promise<LLMResponse>;
    abstract chatStream(messages: LLMMessage[], tools?: ToolMetadata[]): AsyncGenerator<LLMStreamChunk, void, unknown>;
    protected formatToolsForAPI(tools: ToolMetadata[]): any[];
}
//# sourceMappingURL=LLMClient.d.ts.map
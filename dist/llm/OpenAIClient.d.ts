import { LLMClient } from './LLMClient';
import { LLMMessage, LLMResponse, LLMStreamChunk, ToolMetadata, AgentTreeConfig } from '../types';
export declare class OpenAIClient extends LLMClient {
    private client;
    constructor(config: AgentTreeConfig);
    chat(messages: LLMMessage[], tools?: ToolMetadata[], streaming?: boolean): Promise<LLMResponse>;
    chatStream(messages: LLMMessage[], tools?: ToolMetadata[]): AsyncGenerator<LLMStreamChunk, void, unknown>;
    private convertMessages;
}
//# sourceMappingURL=OpenAIClient.d.ts.map
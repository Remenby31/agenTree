import { LLMMessage, LLMResponse, LLMStreamChunk, ToolMetadata, AgentTreeConfig } from '../types';

export abstract class LLMClient {
  protected config: AgentTreeConfig;

  constructor(config: AgentTreeConfig) {
    this.config = config;
  }

  abstract chat(
    messages: LLMMessage[],
    tools?: ToolMetadata[],
    streaming?: boolean
  ): Promise<LLMResponse>;

  abstract chatStream(
    messages: LLMMessage[],
    tools?: ToolMetadata[]
  ): AsyncGenerator<LLMStreamChunk, void, unknown>;

  protected formatToolsForAPI(tools: ToolMetadata[]): any[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }
}

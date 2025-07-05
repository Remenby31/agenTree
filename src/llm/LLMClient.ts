import { LLMMessage, LLMResponse, LLMStreamChunk, ToolMetadata } from '../types';

export interface LLMConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  outputFile: boolean;
  outputFolder: string;
  streaming: boolean;
}

export abstract class LLMClient {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
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

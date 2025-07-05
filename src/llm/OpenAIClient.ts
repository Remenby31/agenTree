import OpenAI from 'openai';
import { LLMClient, LLMConfig } from './LLMClient';
import { LLMMessage, LLMResponse, LLMStreamChunk, ToolMetadata, ToolCall } from '../types';

export class OpenAIClient extends LLMClient {
  private client: OpenAI;

  constructor(config: LLMConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
  }

  async chat(
    messages: LLMMessage[],
    tools?: ToolMetadata[],
    streaming?: boolean
  ): Promise<LLMResponse> {
    if (streaming) {
      // For streaming, we need to collect all chunks
      const chunks: LLMStreamChunk[] = [];
      for await (const chunk of this.chatStream(messages, tools)) {
        chunks.push(chunk);
      }
      
      // Combine chunks into final response
      const content = chunks.map(c => c.content || '').join('');
      const toolCalls = chunks
        .filter(c => c.tool_calls && c.tool_calls.length > 0)
        .flatMap(c => c.tool_calls)
        .filter((tc): tc is ToolCall => !!tc && !!tc.id);

      return {
        content,
        tool_calls: toolCalls
      };
    }

    const openAIMessages = this.convertMessages(messages);
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: this.config.model,
      messages: openAIMessages,
      temperature: 0
    };

    if (tools && tools.length > 0) {
      params.tools = this.formatToolsForAPI(tools);
      params.tool_choice = 'auto';
    }

    const response = await this.client.chat.completions.create(params);
    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      tool_calls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        type: tc.type,
        function: tc.function
      })),
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      } : undefined
    };
  }

  async* chatStream(
    messages: LLMMessage[],
    tools?: ToolMetadata[]
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const openAIMessages = this.convertMessages(messages);
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      model: this.config.model,
      messages: openAIMessages,
      temperature: 0,
      stream: true
    };

    if (tools && tools.length > 0) {
      params.tools = this.formatToolsForAPI(tools);
      params.tool_choice = 'auto';
    }

    const stream = await this.client.chat.completions.create(params);
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (!delta) {
        continue;
      }


      const streamChunk: LLMStreamChunk = {
        content: delta.content || undefined,
        tool_calls: delta.tool_calls?.map(tc => ({
          id: tc.id || '',
          type: 'function' as const,
          function: {
            name: tc.function?.name || '',
            arguments: tc.function?.arguments || ''
          },
          index: tc.index // Preserve the index from OpenAI
        })),
        done: chunk.choices[0]?.finish_reason !== null
      };

      yield streamChunk;
    }
  }

  private convertMessages(messages: LLMMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return { role: 'system', content: msg.content };
        case 'user':
          return { role: 'user', content: msg.content };
        case 'assistant':
          return {
            role: 'assistant',
            content: msg.content,
            tool_calls: msg.tool_calls
          };
        case 'tool':
          return {
            role: 'tool',
            content: msg.content,
            tool_call_id: msg.tool_call_id!
          };
        default:
          throw new Error(`Unknown message role: ${msg.role}`);
      }
    });
  }
}

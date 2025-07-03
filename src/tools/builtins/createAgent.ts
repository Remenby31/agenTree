import { ToolMetadata } from '../../types';

export interface CreateAgentParams {
  name: string;
  task: string;
  context?: string[];
  tools?: string[];
  systemPrompt?: string;
}

export const createAgentMetadata: ToolMetadata = {
  name: 'createAgent',
  description: 'Create a child agent to handle a specific subtask',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name for the child agent'
      },
      task: {
        type: 'string', 
        description: 'Task description for the child agent'
      },
      context: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional context (files, URLs, text) for the child agent'
      },
      tools: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of tool names the child agent should have access to'
      },
      systemPrompt: {
        type: 'string',
        description: 'Optional custom system prompt for the child agent'
      }
    },
    required: ['name', 'task']
  }
};

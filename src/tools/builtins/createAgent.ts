import { ToolMetadata } from '../../types';

export interface CreateAgentParams {
  name: string;
  task: string;
  context?: string[];
  tools: string[];
  systemPrompt?: string;
}

export const createAgentMetadata: ToolMetadata = {
  name: 'createAgent',
  description: 'Creates a new child agent to perform a specific subtask, allowing for modular task management and enhanced parallel processing.',
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
        description: 'List of tool names the child agent should have access to. You can give all the tools you have, with this format: ["tool1", "tool2", "tool3"]. If you want to put all the default tools, you can use ["default"]. If you want to use no tools, you can use an empty array [].'
      },
      systemPrompt: {
        type: 'string',
        description: 'Optional custom system prompt for the child agent'
      }
    },
    required: ['name', 'task', 'tools']
  }
};

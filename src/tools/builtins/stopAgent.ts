import { ToolMetadata } from '../../types';

export interface StopAgentParams {
  result: string;
  success?: boolean;
}

export const stopAgentMetadata: ToolMetadata = {
  name: 'stopAgent',
  description: 'Stop the current agent execution and return the final result',
  parameters: {
    type: 'object',
    properties: {
      result: {
        type: 'string',
        description: 'The final result to return to the parent agent'
      },
      success: {
        type: 'boolean',
        description: 'Whether the task was completed successfully',
        default: true
      }
    },
    required: ['result']
  }
};

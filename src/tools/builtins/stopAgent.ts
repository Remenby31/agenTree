import { ToolMetadata } from '../../types';

export interface StopAgentParams {
  result: string;
  success?: boolean;
}

export const stopAgentMetadata: ToolMetadata = {
  name: 'stopAgent',
  description: 'Terminates the current agent\'s execution and returns the final result to the parent agent, indicating whether the task was completed successfully.',
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

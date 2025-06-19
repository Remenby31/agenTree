import { registerTool } from '../ToolDecorator';
import { ToolMetadata } from '../../types';

export interface StopAgentParams {
  result: string;
  success?: boolean;
}

/**
 * Stop the current agent execution and return the final result
 * @param result The final result to return to the parent agent
 * @param success Whether the task was completed successfully (default: true)
 */
export async function stopAgent(params: StopAgentParams): Promise<string> {
  // This is a placeholder - the actual implementation will be injected by the Agent class
  throw new Error('stopAgent tool must be executed within an Agent context');
}

const metadata: ToolMetadata = {
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

registerTool('stopAgent', stopAgent, metadata);

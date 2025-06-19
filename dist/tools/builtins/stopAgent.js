"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopAgent = stopAgent;
const ToolDecorator_1 = require("../ToolDecorator");
/**
 * Stop the current agent execution and return the final result
 * @param result The final result to return to the parent agent
 * @param success Whether the task was completed successfully (default: true)
 */
async function stopAgent(params) {
    // This is a placeholder - the actual implementation will be injected by the Agent class
    throw new Error('stopAgent tool must be executed within an Agent context');
}
const metadata = {
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
(0, ToolDecorator_1.registerTool)('stopAgent', stopAgent, metadata);
//# sourceMappingURL=stopAgent.js.map
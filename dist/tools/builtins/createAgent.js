"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = createAgent;
const ToolDecorator_1 = require("../ToolDecorator");
/**
 * Create a child agent to handle a specific subtask
 * @param name Name for the child agent
 * @param task Task description for the child agent
 * @param context Optional context (files, URLs, text) for the child agent
 * @param tools Optional list of tool names the child agent should have access to
 */
async function createAgent(params) {
    // This is a placeholder - the actual implementation will be injected by the Agent class
    throw new Error('createAgent tool must be executed within an Agent context');
}
const metadata = {
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
            }
        },
        required: ['name', 'task']
    }
};
(0, ToolDecorator_1.registerTool)('createAgent', createAgent, metadata);
//# sourceMappingURL=createAgent.js.map
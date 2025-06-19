"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
class LLMClient {
    constructor(config) {
        this.config = config;
    }
    formatToolsForAPI(tools) {
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
exports.LLMClient = LLMClient;
//# sourceMappingURL=LLMClient.js.map
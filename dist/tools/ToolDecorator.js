"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tool = tool;
exports.registerTool = registerTool;
const ToolRegistry_1 = require("./ToolRegistry");
function tool(metadata) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        // For now, use basic metadata extraction
        // This will be enhanced with the build-time transformer later
        const toolMetadata = {
            name: metadata?.name || propertyKey,
            description: metadata?.description || `Tool: ${propertyKey}`,
            parameters: metadata?.parameters || {
                type: 'object',
                properties: {},
                required: []
            }
        };
        originalMethod.__toolMetadata = toolMetadata;
        // Auto-register the tool
        ToolRegistry_1.ToolRegistry.register(toolMetadata.name, originalMethod);
        return descriptor;
    };
}
// Helper function to manually register tools with metadata
function registerTool(name, func, metadata) {
    func.__toolMetadata = metadata;
    ToolRegistry_1.ToolRegistry.register(name, func);
}
//# sourceMappingURL=ToolDecorator.js.map
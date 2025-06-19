import { ToolFunction, ToolMetadata } from '../types';
import { ToolRegistry } from './ToolRegistry';

export function tool(metadata?: Partial<ToolMetadata>) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as ToolFunction;
    
    // For now, use basic metadata extraction
    // This will be enhanced with the build-time transformer later
    const toolMetadata: ToolMetadata = {
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
    ToolRegistry.register(toolMetadata.name, originalMethod);
    
    return descriptor;
  };
}

// Helper function to manually register tools with metadata
export function registerTool(name: string, func: ToolFunction, metadata: ToolMetadata): void {
  func.__toolMetadata = metadata;
  ToolRegistry.register(name, func);
}

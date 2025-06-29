// Type for a tool reference: string (tool name) or function
import { ToolFunction } from './index';
import { ToolRegistry } from '../tools/ToolRegistry';

export type ToolReference = string | ToolFunction;

export class ToolResolver {
  static resolveTools(tools: ToolReference[]): string[] {
    if (!tools) return [];
    return tools.map(tool => {
      if (typeof tool === 'string') {
        return tool;
      }
      // Register the tool if not already registered
      if (tool.__toolMetadata && tool.__toolMetadata.name) {
        if (!ToolRegistry.get(tool.__toolMetadata.name)) {
          ToolRegistry.register(tool.__toolMetadata.name, tool);
        }
        return tool.__toolMetadata.name;
      }
      throw new Error('Invalid tool function: missing __toolMetadata.name');
    });
  }
}

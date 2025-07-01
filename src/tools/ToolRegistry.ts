import { Tool } from '../types';

export class ToolRegistry {
  private static tools: Map<string, Tool> = new Map();

  public static register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  public static get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  public static list(): string[] {
    return Array.from(this.tools.keys());
  }

  public static clear(): void {
    this.tools.clear();
  }

  public static has(name: string): boolean {
    return this.tools.has(name);
  }

  public static getAll(): Tool[] {
    return Array.from(this.tools.values());
  }
}

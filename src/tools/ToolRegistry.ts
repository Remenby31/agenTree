import { ToolFunction, ToolMetadata } from '../types';

export class ToolRegistry {
  private static tools: Map<string, ToolFunction> = new Map();

  public static register(name: string, func: ToolFunction): void {
    this.tools.set(name, func);
  }

  public static get(name: string): ToolFunction | undefined {
    return this.tools.get(name);
  }

  public static getMetadata(name: string): ToolMetadata | undefined {
    const tool = this.tools.get(name);
    return tool?.__toolMetadata;
  }

  public static getAllMetadata(toolNames?: string[]): ToolMetadata[] {
    const names = toolNames || Array.from(this.tools.keys());
    return names
      .map(name => this.getMetadata(name))
      .filter((metadata): metadata is ToolMetadata => !!metadata);
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
}

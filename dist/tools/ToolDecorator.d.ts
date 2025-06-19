import { ToolFunction, ToolMetadata } from '../types';
export declare function tool(metadata?: Partial<ToolMetadata>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function registerTool(name: string, func: ToolFunction, metadata: ToolMetadata): void;
//# sourceMappingURL=ToolDecorator.d.ts.map
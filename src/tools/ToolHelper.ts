import { z } from 'zod';

export interface ToolOptions<T extends z.ZodSchema> {
  name?: string;
  description: string;
  parameters: T;
  strict?: boolean;
  execute: (args: z.infer<T>, context?: any) => Promise<string> | string;
  errorFunction?: (context: any, error: Error) => string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, context?: any) => Promise<string> | string;
  errorFunction?: (context: any, error: Error) => string;
}

function zodSchemaToJsonSchema(schema: z.ZodSchema): any {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as z.ZodSchema;
      properties[key] = zodFieldToJsonSchema(fieldSchema);
      
      if (!fieldSchema.isOptional()) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
  }
  
  return zodFieldToJsonSchema(schema);
}

function zodFieldToJsonSchema(schema: z.ZodSchema): any {
  if (schema instanceof z.ZodString) {
    const result: any = { type: 'string' };
    if (schema.description) result.description = schema.description;
    return result;
  }
  
  if (schema instanceof z.ZodNumber) {
    const result: any = { type: 'number' };
    if (schema.description) result.description = schema.description;
    return result;
  }
  
  if (schema instanceof z.ZodBoolean) {
    const result: any = { type: 'boolean' };
    if (schema.description) result.description = schema.description;
    return result;
  }
  
  if (schema instanceof z.ZodArray) {
    const result: any = { 
      type: 'array',
      items: zodFieldToJsonSchema(schema.element)
    };
    if (schema.description) result.description = schema.description;
    return result;
  }
  
  if (schema instanceof z.ZodEnum) {
    const result: any = { 
      type: 'string',
      enum: schema.options
    };
    if (schema.description) result.description = schema.description;
    return result;
  }
  
  if (schema instanceof z.ZodOptional) {
    return zodFieldToJsonSchema(schema.unwrap());
  }
  
  if (schema instanceof z.ZodDefault) {
    const result = zodFieldToJsonSchema(schema.removeDefault());
    result.default = schema._def.defaultValue();
    return result;
  }
  
  if (schema instanceof z.ZodAny) {
    const result: any = {};
    if (schema.description) result.description = schema.description;
    return result;
  }
  
  // Fallback for unknown types
  return { type: 'string' };
}

export function tool<T extends z.ZodSchema>(options: ToolOptions<T>): Tool {
  const { name, description, parameters, strict = true, execute, errorFunction } = options;
  
  // Generate tool name from function name if not provided
  const toolName = name || execute.name || 'unnamed_tool';
  
  // Convert Zod schema to JSON Schema format
  const jsonSchema = zodSchemaToJsonSchema(parameters);
  
  const wrappedExecute = async (args: any, context?: any): Promise<string> => {
    try {
      // Validate arguments if strict mode is enabled
      if (strict) {
        const validationResult = parameters.safeParse(args);
        if (!validationResult.success) {
          const errorMessage = `Invalid arguments for tool '${toolName}': ${validationResult.error.message}`;
          if (errorFunction) {
            return errorFunction(context, new Error(errorMessage));
          }
          throw new Error(errorMessage);
        }
        args = validationResult.data;
      }
      
      const result = await execute(args, context);
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      if (errorFunction) {
        return errorFunction(context, error as Error);
      }
      throw error;
    }
  };
  
  return {
    name: toolName,
    description,
    parameters: jsonSchema,
    execute: wrappedExecute,
    errorFunction
  };
}
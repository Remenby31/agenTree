// Générateur de métadonnées pour outils à partir des infos TypeScript et JSDoc

import { ToolMetadata } from '../src/types';
import { FunctionInfo } from './type-analyzer';
import { JSDocInfo } from './jsdoc-extractor';

export class MetadataGenerator {
  generateToolMetadata(functionInfo: FunctionInfo, jsdocInfo: JSDocInfo): ToolMetadata {
    return {
      name: functionInfo.name,
      description: jsdocInfo.description || '',
      parameters: this.generateParametersSchema(functionInfo, jsdocInfo),
    };
  }

  generateParametersSchema(
    functionInfo: FunctionInfo,
    jsdocInfo: JSDocInfo
  ): { type: "object"; properties: Record<string, any>; required?: string[] } {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const param of functionInfo.parameters) {
      const paramDescription = jsdocInfo.paramDescriptions?.get(param.name);
      const schema: any = {
        type: this.tsTypeToJsonSchemaType(param.type),
      };

      if (paramDescription) {
        schema.description = paramDescription;
      }
      if (param.defaultValue !== undefined) {
        schema.default = param.defaultValue;
      }
      properties[param.name] = schema;

      if (!param.optional && param.defaultValue === undefined) {
        required.push(param.name);
      }
    }

    // Toujours retourner un objet conforme au type attendu
    const result: { type: "object"; properties: Record<string, any>; required?: string[] } = {
      type: "object",
      properties,
    };
    if (required.length > 0) {
      result.required = required;
    }
    return result;
  }

  private tsTypeToJsonSchemaType(tsType: string): string {
    switch (tsType) {
      case 'string':
      case 'String':
        return 'string';
      case 'number':
      case 'Number':
        return 'number';
      case 'boolean':
      case 'Boolean':
        return 'boolean';
      case 'any':
        return 'object';
      case 'object':
        return 'object';
      case 'Array':
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }
}
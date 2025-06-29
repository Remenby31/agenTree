import { ToolFunction, ToolMetadata } from '../types';
import { ToolRegistry } from './ToolRegistry';

export function tool(metadata?: Partial<ToolMetadata>) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as ToolFunction;

    // Fallback : extraction runtime si métadonnées absentes ou incomplètes
    let toolMetadata: ToolMetadata | undefined = undefined;

    // Métadonnées injectées par le transformer : doivent être complètes (name, description, parameters)
    if (
      metadata &&
      typeof metadata.name === 'string' &&
      typeof metadata.description === 'string' &&
      typeof metadata.parameters === 'object'
    ) {
      toolMetadata = {
        name: metadata.name,
        description: metadata.description,
        parameters: metadata.parameters
      };
    } else {
      // Fallback : extraction basique runtime
      toolMetadata = extractMetadataAtRuntime(originalMethod, propertyKey);
    }

    originalMethod.__toolMetadata = toolMetadata;

    // Auto-register the tool
    ToolRegistry.register(toolMetadata.name, originalMethod);

    return descriptor;
  };
}

/**
 * Extraction basique de métadonnées depuis la signature de la fonction.
 * Utilisé en fallback si les métadonnées injectées sont absentes ou incomplètes.
 */
function extractMetadataAtRuntime(fn: Function, propertyKey: string): ToolMetadata {
  // Nom : nom de la propriété ou nom de la fonction
  const name = propertyKey || fn.name || 'anonymousTool';

  // Description : générique
  const description = `Tool: ${name}`;

  // Paramètres : extraction naïve depuis la signature (arguments)
  // On tente d'extraire les noms d'arguments via regex sur fn.toString()
  const fnStr = fn.toString();
  const argsMatch = fnStr.match(/^[\s\S]*?\(([^)]*)\)/);
  let paramNames: string[] = [];
  if (argsMatch && argsMatch[1].trim()) {
    paramNames = argsMatch[1]
      .split(',')
      .map(arg => arg.trim())
      .filter(arg => arg.length > 0);
  }

  // On construit un schéma JSON Schema minimal
  const parameters = {
    type: "object" as const,
    properties: Object.fromEntries(paramNames.map(p => [p, { type: "string" as const }])),
    required: paramNames
  };

  return {
    name,
    description,
    parameters
  };
}

// Helper function to manually register tools with metadata
export function registerTool(name: string, func: ToolFunction, metadata: ToolMetadata): void {
  func.__toolMetadata = metadata;
  ToolRegistry.register(name, func);
}

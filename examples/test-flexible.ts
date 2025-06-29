import { Agent } from '../src';
import { tool } from '../src/tools/ToolDecorator';

// Définir et enregistrer le tool avec métadonnées manuellement
function calculator(a: number, b: number, op: string = "+"): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b !== 0 ? a / b : NaN;
    default: throw new Error("Opérateur non supporté");
  }
}
calculator.__toolMetadata = {
  name: "calculator",
  description: "Calcule une opération arithmétique simple.",
  parameters: {
    type: "object" as const,
    properties: {
      a: { type: "number" },
      b: { type: "number" },
      op: { type: "string", enum: ["+", "-", "*", "/"], default: "+" }
    },
    required: ["a", "b"]
  }
};

// Lire la clé API depuis la variable d'environnement
const apiKey = process.env.OPENAI_KEY_API || 'test-key';

const agent = new Agent({
  name: "flexible-agent",
  task: "Test flexible tools support.",
  tools: [calculator, 'stopAgent'],
  config: {
    apiKey,
    model: "gpt-4o-mini",
    maxDepth: 2,
    outputFile: false,
  }
});

console.log("Agent created with tools:", agent['tools']);

import { Agent, tool } from '../src'; // Adjust the import path as necessary
import { z } from 'zod';

// Lire la clé API depuis la variable d'environnement
const apiKey = process.env.OPENAI_KEY_API || '';
if (!apiKey) {
  throw new Error('OPENAI_KEY_API non définie dans les variables d\'environnement');
}

// Créer un outil calculatrice
const calculatorTool = tool({
  name: 'calculator',
  description: 'Performs basic mathematical calculations',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The mathematical operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  }),
  async execute({ operation, a, b }) {
    let result: number;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        result = a / b;
        break;
    }
    return `${a} ${operation} ${b} = ${result}`;
  }
});

// Simple test without actual API call
const agent = new Agent({
  name: "test-agent",
  task: "Use the calculator tool to add 25 and 17, then use it again to multiply the result by 3. Show the calculations.",
  tools: [calculatorTool],
  apiKey,
  model: "gpt-4.1-mini",
  maxDepth: 2,
  outputFile: false,
  streaming: false,
});

agent.on('agentCompleted', (result) => {
  console.log('Agent completed successfully:', result);
});

agent.on('childCreated', (child) => {
  console.log('Child agent created:', child);
});

// Anciens événements (groupés)
agent.on('toolCalls', (data) => {
  console.log('📋 Tool calls summary:', data.toolCalls.join(', '));
});

// Nouveaux événements granulaires
agent.on('toolCallStarted', (data) => {
  console.log(`🚀 Tool started: ${data.toolName}`);
  console.log(`   Input: ${JSON.stringify(data.toolInput)}`);
});

agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.log(`❌ Tool failed: ${data.toolName} (${data.duration}ms)`);
    console.log(`   Error: ${data.toolError}`);
  } else {
    console.log(`✅ Tool completed: ${data.toolName} (${data.duration}ms)`);
    console.log(`   Output: ${data.toolOutput}`);
  }
});

// Événement de streaming (si activé)
agent.on('streamChunk', (data) => {
  console.log(`\n🔄 Streaming chunk received:`, JSON.stringify(data.chunk, null, 2));
  if (data.chunk.content) {
    process.stdout.write(`💭 ${data.chunk.content}`);
  }
  if (data.chunk.done) {
    console.log('\n🏁 Stream finished');
  }
});

agent.execute().then((result) => {
  console.log('Execution result:', result);
}).catch((error) => {
  console.error('Execution error:', error);
});

import { Agent } from '../src';

// Lire la clé API depuis la variable d'environnement
const apiKey = process.env.OPENAI_KEY_API || '';
if (!apiKey) {
  throw new Error('OPENAI_KEY_API non définie dans les variables d\'environnement');
}

// Simple test without actual API call
const agent = new Agent({
  name: "test-agent",
  task: "Think about the future of AI, and write a short essay about it.",
  config: {
    apiKey,
    model: "gpt-4o-mini",
    maxDepth: 2,
    outputFile: true,
  }
});

agent.on('agentCompleted', (result) => {
  console.log('Agent completed successfully:', result);
});

agent.on('childCreated', (child) => {
  console.log('Child agent created:', child);
});

agent.execute().then((result) => {
  console.log('Execution result:', result);
}).catch((error) => {
  console.error('Execution error:', error);
});

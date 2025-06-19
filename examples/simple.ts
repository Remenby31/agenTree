import { Agent } from '../src';

async function main() {
  try {
    // Simple test without actual API call
    const agent = new Agent({
      name: "test-agent",
      task: "What is 2+2?",
      config: {
        apiKey: "test-key",
        model: "gpt-4",
        maxDepth: 2
      }
    });

    console.log('Agent created successfully!');
    console.log('Agent name:', (agent as any).task.name);
    console.log('Agent task:', (agent as any).task.description);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

if (require.main === module) {
  main();
}

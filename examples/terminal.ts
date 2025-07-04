// Terminal agent example: usage
//   npx tsx examples/terminal.ts "your task here"

import { Agent } from '../src/core/Agent';
import { defaultTools } from '../src/tools/defaults';

const apiKey = process.env.OPENAI_KEY_API || '';
if (!apiKey) {
  console.error('OPENAI_KEY_API is not set in environment variables');
  process.exit(1);
}

const [, , ...args] = process.argv;
const task = args.join(' ').trim();

if (!task) {
  console.error('Usage: npx tsx examples/terminal.ts "your task to execute"');
  process.exit(1);
}

// Simple hierarchical tracking system
const agentHierarchy = new Map<string, { level: number; parent?: string; status: 'running' | 'completed' | 'error' }>();
const thinkingAgents = new Set<string>();

// Colors for levels
const colors = {
  0: '\x1b[36m', // Cyan
  1: '\x1b[33m', // Yellow
  2: '\x1b[35m', // Magenta
  3: '\x1b[32m', // Green
  4: '\x1b[34m', // Blue
};
const reset = '\x1b[0m';
const bold = '\x1b[1m';
const dim = '\x1b[2m';

// Function to get the indentation prefix
function getPrefix(name: string): string {
  const info = agentHierarchy.get(name);
  if (!info) {
    // If the agent is not in the hierarchy, return a default prefix
    return `\x1b[37m[${name}]\x1b[0m`;
  }
  
  const level = info.level;
  const color = colors[level] || '\x1b[37m';
  const indent = '  '.repeat(level);
  const symbol = level === 0 ? '[ROOT]' : '├─';
  
  return `${color}${indent}${symbol}${reset}`;
}

// Function to display the hierarchy in real-time
function displayCurrentHierarchy(): void {
  console.log('\nAgent hierarchy:');
  
  // Recursive function to display an agent and its children
  function displayAgent(name: string, indent: string = '') {
    const info = agentHierarchy.get(name);
    if (!info) return;
    
    const color = colors[info.level] || '\x1b[37m';
    const symbol = info.level === 0 ? '[ROOT]' : '├─';
    const status = info.status === 'running' ? '[RUNNING]' : info.status === 'completed' ? '[DONE]' : '[ERROR]';
    
    console.log(`${color}${indent}${symbol} ${name}${reset} ${dim}${status}${reset}`);
    
    // Find and display all direct children of this agent
    const children = Array.from(agentHierarchy.entries())
      .filter(([childName, childInfo]) => childInfo.parent === name)
      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB)); // Alphabetical sort
    
    children.forEach(([childName]) => {
      displayAgent(childName, indent + '  ');
    });
  }
  
  // Start with the root agent
  displayAgent('terminal-agent');
  console.log('');
}

// Function to update final statuses
function updateFinalStatuses(result: any) {
  // Recursively mark all agents as completed if they succeeded
  function markCompleted(agentResult: any) {
    if (agentResult.name) {
      const info = agentHierarchy.get(agentResult.name);
      if (info) {
        info.status = agentResult.success ? 'completed' : 'error';
      }
    }
    
    if (agentResult.children) {
      agentResult.children.forEach(markCompleted);
    }
  }
  
  markCompleted(result);
}

const agent = new Agent({
  name: 'terminal-agent',
  task,
  tools: defaultTools,
  apiKey,
  model: 'gpt-4.1-mini',
  outputFile: false,
  streaming: true,
  maxDepth: 1
});

// Initialize the root agent
agentHierarchy.set('terminal-agent', { level: 0, status: 'running' });

const taskText = `Task: "${task}"`;
const horizontalLine = `─`.repeat(taskText.length + 2);
console.log(`\n┌${horizontalLine}┐`);
console.log(`│ ${bold}Task:${reset} "${task}" │`);
console.log(`└${horizontalLine}┘\n`);

// Clean event handling
agent.on('agentStarted', (data) => {
  //pass
});

agent.on('childCreated', (data) => {
  // Determine the parent's level
  const parentName = data.parentName || 'terminal-agent';
  const parentInfo = agentHierarchy.get(parentName);
  const parentLevel = parentInfo?.level || 0;
  
  // Add the child to the hierarchy
  agentHierarchy.set(data.childName, {
    level: parentLevel + 1,
    parent: parentName,
    status: 'running'
  });
  
  const childPrefix = getPrefix(data.childName);
  console.log(`${childPrefix} Created: "${data.childTask}"`);
});

agent.on('toolCallStarted', (data) => {
  // Use the name of the agent emitting the event, not the one receiving it
  const agentName = data.name || 'terminal-agent';
  const prefix = getPrefix(agentName);
  
  if (data.toolName === 'createAgent') {
    const task = `${bold}"${data.toolInput.task}"${reset}${dim}`;
    const context = `Context: ${data.toolInput.context ? data.toolInput.context.join(', ') : 'none'}`;
    const tools = `Tools: ${data.toolInput.tools ? data.toolInput.tools.join(', ') : 'default tools'}`;
    const systemPrompt = `System prompt: ${data.toolInput.systemPrompt || 'none'}`;
    
    console.log(`${prefix} ${bold}+> Creating child agent:${reset} ${task} ${dim}| ${context} | ${tools} | ${systemPrompt}${reset}`);
  } else if (data.toolName === 'stopAgent') {
    const result = `${bold}"${data.toolInput.result}"${reset}${dim}`;
    const success = data.toolInput.success !== undefined ? `Success: ${data.toolInput.success}` : 'Success: true';
    console.log(`${prefix} +> Stopping agent: ${result} | ${success}${reset}`);
  } else if (data.toolName === 'writeFile') {
    // For writeFile, we only display the fist 100 characters of the content
    // to avoid cluttering the terminal
    const filePath = data.toolInput.filePath || 'unknown';
    const fileContent = data.toolInput.content || 'empty';
    const truncatedContent = fileContent.length > 100 ? fileContent.slice(0, 100) + '...' : fileContent;
    console.log(`${prefix} ${dim}Calling tool: ${data.toolName} for file ${filePath} with content: "${truncatedContent}"`);
  } else {
    console.log(`${prefix} ${dim}Calling tool: ${data.toolName} with input: ${JSON.stringify(data.toolInput)}${reset}`);
  }
});


agent.on('agentCompleted', (data) => {
  // Update status
  const info = agentHierarchy.get(data.name);
  if (info) {
    info.status = 'completed';
  }
  
  const prefix = getPrefix(data.name);
  const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
  console.log(`${prefix} Completed ✅`);
});

agent.on('agentError', (data) => {
  const info = agentHierarchy.get(data.name);
  if (info) {
    info.status = 'error';
  }
  
  const prefix = getPrefix(data.name);
  console.error(`${prefix} Error: ${data.error}`);
});






// Ajouter cette variable globale avant les event listeners
const streamingAgents = new Set<string>();
// Ajouter un tracker pour l'agent actuellement en streaming
let currentStreamingAgent: string | null = null;

// Remplacer l'event listener streamChunk par celui-ci :
agent.on('streamChunk', (data) => {
  const name = data.name || 'terminal-agent';
  const content = data.chunk.content || '';
  
  // Ignorer les tool calls, afficher seulement le contenu des messages
  if (content) {
    const prefix = getPrefix(name);
    
    // Si c'est un nouvel agent qui commence à streamer ou si l'agent actuel change
    if (!streamingAgents.has(name) || currentStreamingAgent !== name) {
      // Si un autre agent était en train de streamer, terminer sa ligne
      if (currentStreamingAgent && currentStreamingAgent !== name) {
        process.stdout.write('\n');
      }
      
      process.stdout.write(`${prefix} `);
      streamingAgents.add(name);
      currentStreamingAgent = name;
    }
    
    // Gérer les retours à la ligne en préservant l'indentation
    if (content.includes('\n')) {
      const lines = content.split('\n');
      
      // Première ligne : afficher directement
      process.stdout.write(lines[0]);
      
      // Lignes suivantes : ajouter le préfixe pour chaque nouvelle ligne
      for (let i = 1; i < lines.length; i++) {
        process.stdout.write('\n');
        // Toujours afficher le préfixe, même pour les lignes vides
        process.stdout.write(`${prefix} ${lines[i]}`);
      }
    } else {
      // Afficher le contenu sans retour à la ligne
      process.stdout.write(content);
    }
  }
  
  // Si c'est la fin du stream, nettoyer et ajouter un retour à la ligne
  if (data.chunk.done) {
    streamingAgents.delete(name);
    if (currentStreamingAgent === name) {
      currentStreamingAgent = null;
    }
    process.stdout.write('\n');
  }
});

// Execution
agent.execute().then((result) => {
  console.log('\n' + '─'.repeat(60));
  console.log(`${bold}EXECUTION COMPLETED${reset}`);
  
  // Update final statuses based on results
  updateFinalStatuses(result);
  
  displayCurrentHierarchy();

    
  console.log(`${bold}Final result:${reset} "${result.result}"`);
  console.log(`${bold}Status:${reset} ${result.success ? 'SUCCESS' : 'FAILED'}`);
  
  process.exit(result.success ? 0 : 2);
}).catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exit(2);
});
// Terminal agent example: usage
//   npx tsx examples/terminal.ts "your task here"

import { Agent } from '../src/core/Agent';
import { defaultTools } from '../src/tools/defaults';

const apiKey = process.env.OPENAI_KEY_API || '';
if (!apiKey) {
  console.error('OPENAI_KEY_API non définie dans les variables d\'environnement');
  process.exit(1);
}

const [, , ...args] = process.argv;
const task = args.join(' ').trim();

if (!task) {
  console.error('Usage: npx tsx examples/terminal.ts "votre tâche à exécuter"');
  process.exit(1);
}

// Système de tracking hiérarchique simple
const agentHierarchy = new Map<string, { level: number; parent?: string; status: 'running' | 'completed' | 'error' }>();
const thinkingAgents = new Set<string>();

// Couleurs pour les niveaux
const colors = {
  0: '\x1b[36m', // Cyan
  1: '\x1b[33m', // Jaune  
  2: '\x1b[35m', // Magenta
  3: '\x1b[32m', // Vert
  4: '\x1b[34m', // Bleu
};
const reset = '\x1b[0m';
const bold = '\x1b[1m';
const dim = '\x1b[2m';

// Fonction pour obtenir le préfixe d'indentation
function getPrefix(name: string): string {
  const info = agentHierarchy.get(name);
  if (!info) {
    // Si l'agent n'est pas dans la hiérarchie, retourner un préfixe par défaut
    return `\x1b[37m[${name}]\x1b[0m`;
  }
  
  const level = info.level;
  const color = colors[level] || '\x1b[37m';
  const indent = '  '.repeat(level);
  const symbol = level === 0 ? '[ROOT]' : '├─';
  
  return `${color}${indent}${symbol}${reset}`;
}

// Fonction pour afficher la hiérarchie en temps réel
function displayCurrentHierarchy(): void {
  console.log('\nAgent hierarchy:');
  
  // Fonction récursive pour afficher un agent et ses enfants
  function displayAgent(name: string, indent: string = '') {
    const info = agentHierarchy.get(name);
    if (!info) return;
    
    const color = colors[info.level] || '\x1b[37m';
    const symbol = info.level === 0 ? '[ROOT]' : '├─';
    const status = info.status === 'running' ? '[RUNNING]' : info.status === 'completed' ? '[DONE]' : '[ERROR]';
    
    console.log(`${color}${indent}${symbol} ${name}${reset} ${dim}${status}${reset}`);
    
    // Trouver et afficher tous les enfants directs de cet agent
    const children = Array.from(agentHierarchy.entries())
      .filter(([childName, childInfo]) => childInfo.parent === name)
      .sort(([nameA], [nameB]) => nameA.localeCompare(nameB)); // Tri alphabétique
    
    children.forEach(([childName]) => {
      displayAgent(childName, indent + '  ');
    });
  }
  
  // Commencer par l'agent racine
  displayAgent('terminal-agent');
  console.log('');
}

// Fonction pour mettre à jour les statuts finaux
function updateFinalStatuses(result: any) {
  // Marquer récursivement tous les agents comme terminés s'ils ont réussi
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
  config: {
    apiKey,
    model: 'gpt-4o-mini',
    outputFile: false,
    streaming: true,
  },
  maxDepth: 1
});

// Initialiser l'agent racine
agentHierarchy.set('terminal-agent', { level: 0, status: 'running' });

console.log(`${bold}Task:${reset} "${task}"`);
console.log('─'.repeat(60));

// Event handling épuré
agent.on('agentStarted', (data) => {
  const prefix = getPrefix(data.name);
  console.log(`${prefix} Starting...`);
});

agent.on('childCreated', (data) => {
  // Déterminer le niveau du parent
  const parentName = data.parentName || 'terminal-agent';
  const parentInfo = agentHierarchy.get(parentName);
  const parentLevel = parentInfo?.level || 0;
  
  // Ajouter l'enfant à la hiérarchie
  agentHierarchy.set(data.childName, {
    level: parentLevel + 1,
    parent: parentName,
    status: 'running'
  });
  
  const childPrefix = getPrefix(data.childName);
  console.log(`${childPrefix} Created: "${data.childTask}"`);
});

agent.on('toolCallStarted', (data) => {
  // Utiliser le nom de l'agent qui émet l'événement, pas celui qui le reçoit
  const agentName = data.name || 'terminal-agent';
  const prefix = getPrefix(agentName);
  
  if (data.toolName === 'createAgent') {
    console.log(`${prefix} Creating child agent: "${data.toolInput.task}"`);
    console.log(`${prefix} ${dim}Context: ${data.toolInput.context ? data.toolInput.context.join(', ') : 'none'}${reset}`);
    console.log(`${prefix} ${dim}Tools: ${data.toolInput.tools ? data.toolInput.tools.join(', ') : 'default tools'}${reset}`);
    console.log(`${prefix} ${dim}System prompt: ${data.toolInput.systemPrompt || 'none'}${reset}`);
  } else {
    console.log(`${prefix} ${dim}Calling tool: ${data.toolName} with input: ${JSON.stringify(data.toolInput)}${reset}`);
  }
});

agent.on('agentCompleted', (data) => {
  // Mettre à jour le statut
  const info = agentHierarchy.get(data.name);
  if (info) {
    info.status = 'completed';
  }
  
  const prefix = getPrefix(data.name);
  const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
  console.log(`${prefix} Completed: "${result}"`);
});

agent.on('agentError', (data) => {
  const info = agentHierarchy.get(data.name);
  if (info) {
    info.status = 'error';
  }
  
  const prefix = getPrefix(data.name);
  console.error(`${prefix} Error: ${data.error}`);
});

agent.on('streamChunk', (data) => {
  const name = data.name || 'terminal-agent';
  
  if (data.chunk.content && !thinkingAgents.has(name)) {
    // Premier chunk pour cet agent, afficher qu'on est en train de réfléchir
    const prefix = getPrefix(name);
    console.log(`${prefix} ${dim}Thinking...${reset}`);
    thinkingAgents.add(name);
  }
  
  if (data.chunk.done) {
    // Nettoyage quand le stream est terminé
    thinkingAgents.delete(name);
  }
});

// Exécution
agent.execute().then((result) => {
  console.log('\n' + '─'.repeat(60));
  console.log(`${bold}EXECUTION COMPLETED${reset}`);
  
  // Mettre à jour les statuts finaux basés sur les résultats
  updateFinalStatuses(result);
  
  displayCurrentHierarchy();

    
  console.log(`${bold}Final result:${reset} "${result.result}"`);
  console.log(`${bold}Status:${reset} ${result.success ? 'SUCCESS' : 'FAILED'}`);
  
  process.exit(result.success ? 0 : 2);
}).catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exit(2);
});
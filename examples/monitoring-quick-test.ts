import { EventEmitter } from 'events';

// Simulation d'un Agent avec monitoring pour démonstration
class MockAgent extends EventEmitter {
  constructor(public name: string, public task: string) {
    super();
    // Émettre immédiatement l'événement de création
    setTimeout(() => this.emit('agentCreated', { 
      id: 'mock-id', 
      name, 
      task, 
      depth: 0,
      timestamp: new Date().toISOString()
    }), 10);
  }

  async simulateExecution() {
    // Simulation d'une exécution complète
    this.emit('agentStarted', { 
      id: 'mock-id', 
      name: this.name, 
      task: this.task,
      timestamp: new Date().toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    this.emit('contextLoaded', { 
      id: 'mock-id', 
      name: this.name,
      context: { fileCount: 2, urlCount: 1, textCount: 3 }
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    this.emit('llmCall', { 
      id: 'mock-id', 
      name: this.name,
      messageCount: 2,
      availableTools: ['createAgent', 'stopAgent', 'webSearch']
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    this.emit('toolCalls', { 
      id: 'mock-id', 
      name: this.name,
      toolCalls: ['createAgent']
    });

    // Simuler la création d'un agent enfant
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.emit('childCreated', {
      parentId: 'mock-id',
      parentName: this.name,
      childId: 'child-id',
      childName: 'market-researcher',
      childTask: 'Rechercher les données de marché'
    });

    // Simuler l'exécution de l'enfant
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.emit('childCompleted', {
      id: 'child-id',
      name: 'market-researcher',
      result: { success: true, result: 'Analyse de marché terminée' },
      executionTime: 1250
    });

    await new Promise(resolve => setTimeout(resolve, 200));

    this.emit('agentCompleted', { 
      id: 'mock-id', 
      name: this.name,
      result: { success: true, result: 'Mission terminée avec succès' },
      executionTime: 2000
    });
  }
}

// Fonction de monitoring simple
function setupSimpleMonitoring(agent: MockAgent) {
  console.log('\n🎯 Monitoring simple activé:');
  console.log('============================');

  agent.on('agentCreated', (data) => {
    console.log(`🤖 Agent créé: ${data.name}`);
  });

  agent.on('agentStarted', (data) => {
    console.log(`▶️  Agent démarré: ${data.name}`);
  });

  agent.on('contextLoaded', (data) => {
    console.log(`📁 Contexte chargé: ${data.context.fileCount} fichiers, ${data.context.urlCount} URLs, ${data.context.textCount} textes`);
  });

  agent.on('llmCall', (data) => {
    console.log(`🧠 Appel LLM: ${data.messageCount} messages, ${data.availableTools.length} outils`);
    console.log(`   Outils disponibles: ${data.availableTools.join(', ')}`);
  });

  agent.on('toolCalls', (data) => {
    console.log(`🔧 Utilisation d'outils: ${data.toolCalls.join(', ')}`);
  });

  agent.on('childCreated', (data) => {
    console.log(`👶 Agent enfant créé: ${data.childName}`);
    console.log(`   Tâche enfant: ${data.childTask}`);
  });

  agent.on('childCompleted', (data) => {
    console.log(`✅ Agent enfant terminé: ${data.name} (${data.executionTime}ms)`);
  });

  agent.on('agentCompleted', (data) => {
    console.log(`🏆 Agent principal terminé: ${data.name} (${data.executionTime}ms)`);
    console.log(`📊 Résultat: ${data.result.result}`);
  });
}

// Fonction de monitoring détaillé avec indentation
function setupDetailedMonitoring(agent: MockAgent) {
  console.log('\n🔍 Monitoring détaillé activé:');
  console.log('===============================');

  const agentDepths = new Map();
  agentDepths.set('mock-id', 0);

  const log = (message: string, depth: number = 0, color?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const indent = '  '.repeat(depth);
    const colorCode = color === 'green' ? '\x1b[32m' : 
                     color === 'blue' ? '\x1b[34m' : 
                     color === 'yellow' ? '\x1b[33m' : 
                     color === 'cyan' ? '\x1b[36m' : '';
    const resetCode = color ? '\x1b[0m' : '';
    
    console.log(`${colorCode}[${timestamp}] ${indent}${message}${resetCode}`);
  };

  agent.on('agentCreated', (data) => {
    log(`🤖 Agent créé: ${data.name}`, 0, 'blue');
    log(`📋 Tâche: ${data.task}`, 0, 'blue');
  });

  agent.on('agentStarted', (data) => {
    log(`▶️  Démarrage: ${data.name}`, 0, 'green');
  });

  agent.on('contextLoaded', (data) => {
    log(`📁 Contexte: ${data.context.fileCount} fichiers, ${data.context.urlCount} URLs, ${data.context.textCount} textes`, 0, 'blue');
  });

  agent.on('llmCall', (data) => {
    log(`🧠 LLM: ${data.messageCount} messages, ${data.availableTools.length} outils`, 0, 'yellow');
    log(`   Outils: ${data.availableTools.join(', ')}`, 0);
  });

  agent.on('toolCalls', (data) => {
    log(`🔧 Outils: ${data.toolCalls.join(', ')}`, 0, 'cyan');
  });

  agent.on('childCreated', (data) => {
    agentDepths.set(data.childId, 1);
    log(`👶 Agent enfant: ${data.childName}`, 1, 'blue');
    log(`Tâche: ${data.childTask}`, 1);
  });

  agent.on('childCompleted', (data) => {
    const depth = agentDepths.get(data.id) || 1;
    log(`✅ Enfant terminé: ${data.name} (${data.executionTime}ms)`, depth, 'green');
  });

  agent.on('agentCompleted', (data) => {
    log(`🏆 Principal terminé: ${data.name} (${data.executionTime}ms)`, 0, 'green');
    log(`📊 Résultat: ${data.result.result}`, 0, 'green');
  });
}

async function demonstrateMonitoring() {
  console.log('🚀 Démonstration du monitoring AgenTree');
  console.log('=======================================\n');

  console.log('🎭 Simulation avec MockAgent (EventEmitter)');
  console.log('Ce que vous verrez une fois le monitoring implémenté:\n');

  // Test 1: Monitoring simple
  const agent1 = new MockAgent("market-analyst", "Analyser le marché et créer un rapport");
  setupSimpleMonitoring(agent1);
  
  await agent1.simulateExecution();

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 2: Monitoring détaillé
  const agent2 = new MockAgent("strategic-planner", "Développer une stratégie d'expansion 2025");
  setupDetailedMonitoring(agent2);
  
  await agent2.simulateExecution();

  console.log('\n🎉 Démonstration terminée !');
  console.log('\n💡 Ce que vous venez de voir :');
  console.log('✅ Événements émis en temps réel');
  console.log('✅ Monitoring hiérarchique avec indentation');
  console.log('✅ Couleurs et timestamps');
  console.log('✅ Suivi des agents enfants');
  console.log('✅ Métriques de performance');

  console.log('\n🔧 Pour l\'obtenir dans votre librairie :');
  console.log('1. Implémenter les fichiers de monitoring');
  console.log('2. Remplacer Agent.ts par la version EventEmitter');
  console.log('3. Relancer vos exemples');
}

if (require.main === module) {
  demonstrateMonitoring().catch(console.error);
}
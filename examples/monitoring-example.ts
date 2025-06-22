import { Agent, AgentMonitor, MonitoringPresets } from '../src';

async function demonstrateMonitoring() {
  console.log('🎯 Démonstration du système de monitoring AgenTree\n');

  // 1. Monitoring simple
  console.log('1️⃣ Monitoring simple:');
  console.log('====================');
  
  const simpleAgent = new Agent({
    name: "simple-test",
    task: "Tâche de test simple",
    config: {
      apiKey: "test-key",
      model: "gpt-4o-mini",
      maxDepth: 2
    }
  });

  // Utilisation des presets
  MonitoringPresets.simple(simpleAgent);

  // 2. Monitoring détaillé
  console.log('\n2️⃣ Monitoring détaillé:');
  console.log('=======================');
  
  const detailedAgent = new Agent({
    name: "detailed-test",
    task: "Analyser le marché et créer un rapport complet",
    tools: ['webSearch', 'analyzeData'],
    config: {
      apiKey: "test-key",
      model: "gpt-4o-mini",
      maxDepth: 3
    }
  });

  const monitor = MonitoringPresets.detailed(detailedAgent);

  // 3. Monitoring personnalisé
  console.log('\n3️⃣ Monitoring personnalisé:');
  console.log('============================');
  
  const customAgent = new Agent({
    name: "custom-test",
    task: "Tâche avec monitoring personnalisé",
    config: {
      apiKey: "test-key",
      model: "gpt-4o-mini",
      maxDepth: 2
    }
  });

  // Monitoring personnalisé avec callbacks
  customAgent.on('agentCreated', (data) => {
    console.log(`🎯 Nouvel agent: ${data.name} (profondeur: ${data.depth})`);
  });

  customAgent.on('agentCompleted', (data) => {
    console.log(`🏆 Agent terminé: ${data.name}`);
    console.log(`   ⏱️  Temps: ${data.executionTime}ms`);
    console.log(`   ✅ Succès: ${data.success}`);
  });

  customAgent.on('childCreated', (data) => {
    console.log(`👶 Agent enfant créé: ${data.childName}`);
    console.log(`   📋 Tâche: ${data.childTask}`);
  });

  customAgent.on('llmCall', (data) => {
    console.log(`🧠 Appel LLM pour ${data.name}`);
    console.log(`   💬 Messages: ${data.messageCount}`);
    console.log(`   🔧 Outils: ${data.availableTools.join(', ')}`);
  });

  customAgent.on('toolCalls', (data) => {
    console.log(`🛠️  Utilisation d'outils: ${data.toolCalls.join(', ')}`);
  });

  // 4. Monitoring avec métriques
  console.log('\n4️⃣ Monitoring avec métriques:');
  console.log('==============================');
  
  const metricsAgent = new Agent({
    name: "metrics-test",
    task: "Agent avec collecte de métriques",
    config: {
      apiKey: "test-key",
      model: "gpt-4o-mini",
      maxDepth: 2
    }
  });

  MonitoringPresets.withMetrics(metricsAgent, (metrics) => {
    console.log('📊 Métriques collectées:', {
      agents: metrics.totalAgents,
      appelsLLM: metrics.totalLLMCalls,
      outilsUtilisés: metrics.totalToolCalls,
      erreurs: metrics.totalErrors,
      duréeTotale: `${metrics.totalExecutionTime}ms`
    });
  });

  // 5. Monitoring avancé avec AgentMonitor
  console.log('\n5️⃣ Monitoring avancé:');
  console.log('=====================');
  
  const advancedAgent = new Agent({
    name: "advanced-monitor-test",
    task: "Test du monitoring avancé avec plusieurs niveaux",
    tools: ['webSearch', 'analyzeData', 'generateReport'],
    config: {
      apiKey: "test-key",
      model: "gpt-4o-mini",
      maxDepth: 4
    }
  });

  const advancedMonitor = new AgentMonitor({
    logLevel: 'verbose',
    colors: true,
    timestamps: true,
    indentation: true
  });

  advancedMonitor.monitor(advancedAgent);

  // 6. Monitoring filtré
  console.log('\n6️⃣ Monitoring filtré:');
  console.log('======================');
  
  const filteredAgent = new Agent({
    name: "filtered-test",
    task: "Agent avec monitoring filtré",
    config: {
      apiKey: "test-key",
      model: "gpt-4o-mini",
      maxDepth: 2
    }
  });

  MonitoringPresets.custom(filteredAgent, {
    events: ['agentCreated', 'agentCompleted', 'childCreated'],
    filter: (eventType, data) => {
      // Ne montrer que les agents de profondeur <= 2
      return data.depth <= 2;
    },
    handler: (eventType, data) => {
      console.log(`🔍 [${eventType}] ${data.name} (profondeur ${data.depth})`);
    }
  });

  // Démonstration sans exécution réelle (pas de clé API)
  console.log('\n🎭 Mode démonstration - Événements simulés\n');
  
  // Simuler quelques événements
  console.log('Simulation d\'exécution...\n');
  
  // Note: En mode réel avec une clé API, vous feriez:
  // await simpleAgent.execute();
  // await detailedAgent.execute();
  // etc.
  
  console.log('✨ Démonstration terminée !');
  console.log('\n💡 Pour voir le monitoring en action:');
  console.log('   1. Ajoutez une clé API OpenAI');
  console.log('   2. Lancez: npm run example:monitoring');
  console.log('   3. Observez la décomposition hiérarchique en temps réel');
}

// Fonction pour montrer l'API de monitoring
function showMonitoringAPI() {
  console.log('\n📚 API de monitoring disponible:');
  console.log('================================\n');
  
  console.log('🎯 Événements disponibles:');
  console.log('  • agentCreated    - Agent créé');
  console.log('  • agentStarted    - Agent démarré');
  console.log('  • agentCompleted  - Agent terminé');
  console.log('  • agentError      - Erreur dans l\'agent');
  console.log('  • contextLoaded   - Contexte chargé');
  console.log('  • llmCall         - Appel au LLM');
  console.log('  • toolCalls       - Utilisation d\'outils');
  console.log('  • childCreated    - Agent enfant créé');
  console.log('  • childStarted    - Agent enfant démarré');
  console.log('  • childCompleted  - Agent enfant terminé');
  console.log('  • childError      - Erreur dans agent enfant');
  
  console.log('\n🛠️  Presets disponibles:');
  console.log('  • MonitoringPresets.simple()     - Monitoring basique');
  console.log('  • MonitoringPresets.detailed()   - Monitoring détaillé');
  console.log('  • MonitoringPresets.production() - Pour la production');
  console.log('  • MonitoringPresets.withMetrics() - Avec métriques');
  console.log('  • MonitoringPresets.withLogging() - Avec logs');
  console.log('  • MonitoringPresets.realtime()   - Temps réel (WebSocket)');
  console.log('  • MonitoringPresets.custom()     - Personnalisé');
  
  console.log('\n⚙️  AgentMonitor options:');
  console.log('  • logLevel: silent | basic | detailed | verbose');
  console.log('  • colors: true/false');
  console.log('  • timestamps: true/false');
  console.log('  • indentation: true/false');
  console.log('  • saveToFile: string');
  console.log('  • customLogger: function');
}

if (require.main === module) {
  demonstrateMonitoring()
    .then(() => showMonitoringAPI())
    .catch(console.error);
}
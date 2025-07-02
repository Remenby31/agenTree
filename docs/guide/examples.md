# Exemples d’utilisation avancée d’AgenTree

Cette page présente des cas d’usage concrets et avancés d’AgenTree, illustrés par du code réel. Elle s’adresse aux développeurs souhaitant exploiter pleinement la flexibilité du framework pour créer des agents personnalisés, intégrer des outils métiers et gérer les événements de manière fine.

---

## 1. Création d’un outil personnalisé

AgenTree permet de définir facilement des outils métiers avec validation de paramètres grâce à [Zod](https://zod.dev/).

```typescript
import { tool } from '../src';
import { z } from 'zod';

const calculatorTool = tool({
  name: 'calculator',
  description: 'Performs basic mathematical calculations',
  parameters: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number()
  }),
  async execute({ operation, a, b }) {
    switch (operation) {
      case 'add': return `${a} + ${b} = ${a + b}`;
      case 'subtract': return `${a} - ${b} = ${a - b}`;
      case 'multiply': return `${a} * ${b} = ${a * b}`;
      case 'divide':
        if (b === 0) throw new Error('Division by zero is not allowed');
        return `${a} / ${b} = ${a / b}`;
    }
  }
});
```

---

## 2. Instanciation et configuration d’un agent

L’agent est configuré avec un ou plusieurs outils, une tâche, et des options avancées (modèle, profondeur, streaming, etc.).

```typescript
import { Agent } from '../src';

const agent = new Agent({
  name: "test-agent",
  task: "Utilise l’outil calculator pour additionner 25 et 17, puis multiplie le résultat par 3.",
  tools: [calculatorTool],
  config: {
    apiKey: process.env.OPENAI_KEY_API,
    model: "gpt-4o-mini",
    maxDepth: 2,
    outputFile: true,
    streaming: true,
  }
});
```

---

## 3. Gestion avancée des événements

AgenTree expose de nombreux événements pour monitorer l’exécution, réagir aux étapes clés ou intégrer du logging personnalisé.

```typescript
agent.on('agentCompleted', (result) => {
  console.log('Agent terminé avec succès:', result);
});

agent.on('childCreated', (child) => {
  console.log('Agent enfant créé:', child);
});

// Résumé des appels d’outils
agent.on('toolCalls', (data) => {
  console.log('📋 Outils appelés:', data.toolCalls.join(', '));
});

// Suivi granulaire des outils
agent.on('toolCallStarted', (data) => {
  console.log(`🚀 Outil démarré: ${data.toolName}`);
  console.log(`   Entrée: ${JSON.stringify(data.toolInput)}`);
});

agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.log(`❌ Échec: ${data.toolName} (${data.duration}ms)`);
    console.log(`   Erreur: ${data.toolError}`);
  } else {
    console.log(`✅ Terminé: ${data.toolName} (${data.duration}ms)`);
    console.log(`   Sortie: ${data.toolOutput}`);
  }
});

// Streaming de la sortie (si activé)
agent.on('streamChunk', (data) => {
  if (data.chunk.content) {
    process.stdout.write(`💭 ${data.chunk.content}`);
  }
  if (data.chunk.done) {
    console.log('\n🏁 Stream terminé');
  }
});
```

---

## 4. Conseils pour aller plus loin

- **Ajout d’outils métiers** : Inspirez-vous de la structure de `calculatorTool` pour intégrer vos propres outils (API, scripts, etc.).
- **Gestion du contexte** : Utilisez le système de contexte pour fournir des données ou des fichiers à l’agent (voir [`docs/guide/context-loading.md`](context-loading.md)).
- **Décomposition de tâches** : Profitez de la capacité d’AgenTree à créer des agents enfants pour orchestrer des workflows complexes (voir [`docs/guide/task-decomposition.md`](task-decomposition.md)).
- **Monitoring & Debug** : Branchez-vous sur les événements pour tracer, monitorer ou déboguer l’exécution (voir [`docs/guide/debugging.md`](debugging.md)).

---

## 5. Références croisées

- [API Agent](../api/agent.md)
- [Système d’outils](tools-system.md)
- [Gestion des événements](event-system.md)
- [Exemples additionnels](../examples/index.md)

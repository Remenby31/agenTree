# API des événements AgenTree

Cette page documente le système d’événements d’AgenTree, destiné à la supervision, l’extension et l’intégration fine du comportement des agents.

---

## Architecture du système d’événements

AgenTree utilise un système d’événements fortement typé pour notifier l’évolution du cycle de vie des agents, des appels LLM, des outils, du contexte, et des agents enfants.  
Chaque événement transporte un payload structuré, facilitant la supervision, le monitoring, l’extension ou l’intégration avec d’autres systèmes.

Les événements sont typés via l’interface AgentEvents, qui mappe chaque nom d’événement à la signature de son callback.

---

## Types d’événements

### 1. Cycle de vie de l’agent

- **`agentCreated`** : Création d’un agent  
  Payload : [`AgentEventData`]
- **`agentStarted`** : Démarrage d’un agent  
  Payload : [`AgentEventData`]
- **`agentCompleted`** : Fin d’un agent  
  Payload : [`AgentResultEventData`]
- **`agentError`** : Erreur lors de l’exécution  
  Payload : [`AgentErrorEventData`]

### 2. Exécution et contexte

- **`contextLoaded`** : Chargement du contexte  
  Payload : [`ContextLoadEventData`]
- **`llmCall`** : Appel à un LLM  
  Payload : [`LLMCallEventData`]
- **`toolCalls`** : Appels d’outils (batch)  
  Payload : [`ToolCallEventData`]
- **`toolCallStarted`** : Début d’un appel d’outil  
  Payload : [`ToolCallStartedEventData`]
- **`toolCallCompleted`** : Fin d’un appel d’outil  
  Payload : [`ToolCallCompletedEventData`]
- **`streamChunk`** : Réception d’un chunk de flux  
  Payload : [`StreamChunkEventData`]

### 3. Agents enfants

- **`childCreated`** : Création d’un agent enfant  
  Payload : [`ChildAgentEventData`]

---

## Structure des payloads

Chaque événement possède un payload structuré, héritant généralement de [`AgentEventData`] :

```typescript
interface AgentEventData {
  id: string;
  name: string;
  task: string;
  depth: number;
  parentId?: string;
  timestamp: string;
}
```

Les événements spécialisés ajoutent des champs :

- **Résultat** : `result`, `executionTime`, `success`
- **Erreur** : `error`, `stack`
- **LLM** : `messageCount`, `availableTools`, `model`
- **Outils** : `toolCalls`, `toolDetails`, `toolName`, `toolInput`, `toolOutput`, `toolError`, `duration`, `toolCallId`
- **Flux** : `chunk`, `accumulatedContent`
- **Contexte** : `context` (fichiers, URLs, textes)
- **Agents enfants** : `parentId`, `parentName`, `childId`, `childName`, `childTask`


---

## Utilisation : écouter et émettre des événements

### Écoute d’événements

Pour réagir à un événement, abonnez-vous via le système d’événements de l’agent :

```typescript
agent.on('agentCompleted', (data) => {
  console.log('Agent terminé :', data);
});
```

### Émission d’événements

Les événements sont généralement émis automatiquement par le cœur d’AgenTree.  
Pour émettre un événement personnalisé :

```typescript
agent.emit('agentError', {
  id: '...',
  name: '...',
  task: '...',
  depth: 0,
  timestamp: new Date().toISOString(),
  error: 'Message d’erreur'
});
```

### Extension : nouveaux événements

Pour étendre le système, ajoutez une nouvelle clé dans l’interface `AgentEvents` et définissez le payload associé.  
Exemple :

```typescript
interface AgentEvents {
  ...
  'customEvent': (data: CustomEventData) => void;
}
```

---

## Exemples concrets

### Suivi du cycle de vie

```typescript
agent.on('agentStarted', (data) => {
  // Initialisation de logs ou de métriques
});
agent.on('agentCompleted', (data) => {
  // Traitement du résultat final
});
```

### Monitoring des outils

```typescript
agent.on('toolCallStarted', (data) => {
  console.log(`Outil ${data.toolName} appelé`);
});
agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.error('Erreur outil :', data.toolError);
  }
});
```

---

## Génération des payloads

Utilisez la classe *EventDataBuilder* pour générer des payloads cohérents :

```typescript
const eventData = EventDataBuilder.createResultEventData(agent, result, 123);
agent.emit('agentCompleted', eventData);
```

---

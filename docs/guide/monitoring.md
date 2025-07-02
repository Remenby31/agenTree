# Monitoring technique d’AgenTree

## Introduction

Le système de monitoring d’AgenTree permet de suivre en temps réel l’exécution des agents, de collecter des métriques, de tracer les événements clés et de personnaliser la supervision selon les besoins du développeur. Il s’appuie sur une architecture événementielle et des stratégies modulaires.

---

## Architecture du monitoring

Le cœur du monitoring repose sur la classe [`AgentMonitor`](../../src/monitoring/AgentMonitoring.ts), qui observe les agents via des événements :

- **Événements surveillés** :  
  - `agentCreated`, `agentStarted`, `agentCompleted`, `agentError`
  - `contextLoaded`, `llmCall`, `toolCalls`
  - `childCreated`
- **Options de configuration** ([`MonitoringOptions`](../../src/monitoring/AgentMonitoring.ts)):
  - `logLevel` : `'silent' | 'basic' | 'detailed' | 'verbose'`
  - `colors`, `timestamps`, `indentation` : personnalisation de l’affichage
  - `saveToFile` : chemin du fichier de log (optionnel)
  - `customLogger` : fonction de logging personnalisée

L’état d’exécution est maintenu dans une structure `agentTree` (arbre des agents, profondeur, parenté).

---

## Utilisation de base

### Monitoring détaillé (recommandé)

```ts
import { AgentMonitor } from 'src/monitoring/AgentMonitoring';

const monitor = new AgentMonitor({ logLevel: 'detailed' });
monitor.monitor(agent);
```

### Monitoring simple

```ts
import { MonitoringPresets } from 'src/monitoring/presets';

MonitoringPresets.simple(agent);
```

### Monitoring production (minimal)

```ts
MonitoringPresets.production(agent);
```

---

## Stratégies avancées et extension

### Presets prêts à l’emploi

La classe [`MonitoringPresets`](../../src/monitoring/presets.ts) propose des stratégies adaptées :

- `simple(agent)` : logs concis, adaptés au debug rapide
- `detailed(agent)` : monitoring hiérarchique, couleurs, indentation
- `production(agent)` : logs sobres pour la prod
- `withMetrics(agent, cb?)` : collecte et callback de métriques (agents, LLM, outils, erreurs, temps total)
- `withLogging(agent, logFile?)` : enregistrement dans un fichier
- `realtime(agent, websocket?)` : monitoring temps réel via WebSocket
- `custom(agent, options)` : écoute sélective d’événements, callbacks personnalisés

### Filtrage et hiérarchie

- `parentOnly`, `childrenOnly`, `byDepth`, `byParent` : filtrage des événements selon la profondeur ou la parenté
- `hierarchical(agent)` : affichage arborescent avec indentation

### Extension

- **Logger custom** : injecter une fonction dans `customLogger` pour rediriger les logs (ex : dashboard, stockage distant)
- **Callbacks** : brancher des fonctions sur les événements pour déclencher des actions ou collecter des données spécifiques

---

## Bonnes pratiques

- **Choisir le preset adapté** :  
  - `detailed` pour le développement,  
  - `production` pour la prod,  
  - `withMetrics` pour l’analyse.
- **Limiter le niveau de log en production** (`logLevel: 'basic'` ou `'silent'`)
- **Exploiter l’arbre d’agents** pour visualiser la décomposition des tâches
- **Utiliser les callbacks** pour intégrer le monitoring à des outils externes (alerting, dashboards)
- **Centraliser les logs** via `saveToFile` ou un logger custom

---

## Référence rapide

| Fonction / preset         | Usage principal                        |
|--------------------------|----------------------------------------|
| `AgentMonitor`           | Monitoring configurable, extensible    |
| `simple`                 | Logs concis, debug rapide              |
| `detailed`               | Vue hiérarchique, riche                |
| `production`             | Logs sobres, adaptés à la prod         |
| `withMetrics`            | Collecte de métriques                  |
| `withLogging`            | Sauvegarde dans un fichier             |
| `realtime`               | Monitoring temps réel (WebSocket)      |
| `custom`                 | Stratégie sur-mesure, callbacks        |

---

Pour plus de détails, voir le code source :  
[`src/monitoring/AgentMonitoring.ts`](../../src/monitoring/AgentMonitoring.ts)  
[`src/monitoring/presets.ts`](../../src/monitoring/presets.ts)
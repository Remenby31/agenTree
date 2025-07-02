# AgenTree Technical Monitoring

## Introduction

The AgenTree monitoring system allows real-time tracking of agent execution, collection of metrics, tracing of key events, and customization of supervision according to the developer's needs. It relies on an event-driven architecture and modular strategies.

---

## Monitoring Architecture

The core of the monitoring system is based on the [`AgentMonitor`](../../src/monitoring/AgentMonitoring.ts) class, which observes agents via events:

- **Monitored Events**:
  - `agentCreated`, `agentStarted`, `agentCompleted`, `agentError`
  - `contextLoaded`, `llmCall`, `toolCalls`
  - `childCreated`
- **Configuration Options** ([`MonitoringOptions`](../../src/monitoring/AgentMonitoring.ts)):
  - `logLevel` : `'silent' | 'basic' | 'detailed' | 'verbose'`
  - `colors`, `timestamps`, `indentation`: display customization
  - `saveToFile`: log file path (optional)
  - `customLogger`: custom logging function

The execution state is maintained in an `agentTree` structure (agent tree, depth, parentage).

---

## Basic Usage

### Detailed Monitoring (recommended)

```ts
import { AgentMonitor } from 'src/monitoring/AgentMonitoring';

const monitor = new AgentMonitor({ logLevel: 'detailed' });
monitor.monitor(agent);
```

### Simple Monitoring

```ts
import { MonitoringPresets } from 'src/monitoring/presets';

MonitoringPresets.simple(agent);
```

### Production Monitoring (minimal)

```ts
MonitoringPresets.production(agent);
```

---

## Advanced Strategies and Extension

### Ready-to-use Presets

The [`MonitoringPresets`](../../src/monitoring/presets.ts) class offers adapted strategies:

- `simple(agent)`: concise logs, suitable for quick debugging
- `detailed(agent)`: hierarchical monitoring, colors, indentation
- `production(agent)`: sober logs for production
- `withMetrics(agent, cb?)`: metrics collection and callback (agents, LLM, tools, errors, total time)
- `withLogging(agent, logFile?)`: saving to a file
- `realtime(agent, websocket?)`: real-time monitoring via WebSocket
- `custom(agent, options)`: selective event listening, custom callbacks

### Filtering and Hierarchy

- `parentOnly`, `childrenOnly`, `byDepth`, `byParent`: filtering of events according to depth or parentage
- `hierarchical(agent)`: tree-like display with indentation

### Extension

- **Custom Logger**: inject a function into `customLogger` to redirect logs (e.g., dashboard, remote storage)
- **Callbacks**: attach functions to events to trigger actions or collect specific data

---

## Best Practices

- **Choose the appropriate preset**:
  - `detailed` for development,
  - `production` for production,
  - `withMetrics` for analysis.
- **Limit the log level in production** (`logLevel: 'basic'` or `'silent'`)
- **Exploit the agent tree** to visualize task decomposition
- **Use callbacks** to integrate monitoring with external tools (alerting, dashboards)
- **Centralize logs** via `saveToFile` or a custom logger

---

## Quick Reference

| Function / preset         | Main usage                             |
|--------------------------|----------------------------------------|
| `AgentMonitor`           | Configurable, extensible monitoring    |
| `simple`                 | Concise logs, quick debugging          |
| `detailed`               | Hierarchical, rich view                |
| `production`             | Sober logs, suitable for production    |
| `withMetrics`            | Metrics collection                     |
| `withLogging`            | Saving to a file                       |
| `realtime`               | Real-time monitoring (WebSocket)       |
| `custom`                 | Custom strategy, callbacks             |

---

For more details, see the source code:
[`src/monitoring/AgentMonitoring.ts`](../../src/monitoring/AgentMonitoring.ts)  
[`src/monitoring/presets.ts`](../../src/monitoring/presets.ts)
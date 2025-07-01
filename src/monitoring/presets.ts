import { Agent } from '../core/Agent';
import { AgentMonitor } from './AgentMonitoring';

/**
 * Listeners prêts à l'emploi pour différents cas d'usage
 */
export class MonitoringPresets {

  /**
   * Helper pour écouter seulement les événements des agents parents (depth = 0)
   */
  static parentOnly(agent: Agent, eventName: string, callback: (data: any) => void): void {
    agent.on(eventName as any, (data: any) => {
      if (data.depth === 0) {
        callback(data);
      }
    });
  }

  /**
   * Helper pour écouter seulement les événements des agents enfants (depth > 0)
   */
  static childrenOnly(agent: Agent, eventName: string, callback: (data: any) => void): void {
    agent.on(eventName as any, (data: any) => {
      if (data.depth > 0) {
        callback(data);
      }
    });
  }

  /**
   * Helper pour monitoring hiérarchique avec indentation basée sur la profondeur
   */
  static hierarchical(agent: Agent): void {
    const events = ['agentCreated', 'agentStarted', 'agentCompleted', 'agentError', 'llmCall', 'toolCalls'];
    
    events.forEach(eventName => {
      agent.on(eventName as any, (data: any) => {
        const indent = '  '.repeat(data.depth);
        const emoji = this.getEventEmoji(eventName);
        
        let message = `${indent}${emoji} ${data.name}`;
        
        if (eventName === 'toolCalls') {
          message += `: ${data.toolCalls.join(', ')}`;
        } else if (eventName === 'agentCompleted') {
          message += ` (${data.executionTime}ms)`;
        } else if (eventName === 'agentError') {
          message += ` - ${data.error}`;
        }
        
        console.log(message);
      });
    });
  }

  /**
   * Helper pour filtrer par profondeur spécifique
   */
  static byDepth(agent: Agent, depth: number, eventName: string, callback: (data: any) => void): void {
    agent.on(eventName as any, (data: any) => {
      if (data.depth === depth) {
        callback(data);
      }
    });
  }

  /**
   * Helper pour filtrer par ID parent spécifique
   */
  static byParent(agent: Agent, parentId: string, eventName: string, callback: (data: any) => void): void {
    agent.on(eventName as any, (data: any) => {
      if (data.parentId === parentId) {
        callback(data);
      }
    });
  }

  private static getEventEmoji(eventName: string): string {
    const emojis: { [key: string]: string } = {
      'agentCreated': '🤖',
      'agentStarted': '🚀',
      'agentCompleted': '✅',
      'agentError': '❌',
      'llmCall': '🧠',
      'toolCalls': '🔧',
      'childCreated': '👶'
    };
    return emojis[eventName] || '📋';
  }
  
  /**
   * Monitoring simple pour debug
   */
  static simple(agent: Agent): void {
    agent.on('agentCreated', (data) => {
      console.log(`🤖 Agent: ${data.name}`);
    });

    agent.on('agentCompleted', (data) => {
      console.log(`✅ Terminé: ${data.name} (${data.executionTime}ms)`);
    });

    agent.on('childCreated', (data) => {
      console.log(`  👶 Enfant: ${data.childName}`);
    });

    agent.on('agentError', (data) => {
      console.error(`❌ Erreur: ${data.error}`);
    });
  }

  /**
   * Monitoring détaillé avec arbre hiérarchique
   */
  static detailed(agent: Agent): AgentMonitor {
    const monitor = new AgentMonitor({
      logLevel: 'detailed',
      colors: true,
      timestamps: true,
      indentation: true
    });
    
    monitor.monitor(agent);
    return monitor;
  }

  /**
   * Monitoring pour production (minimal)
   */
  static production(agent: Agent): void {
    agent.on('agentStarted', (data) => {
      console.log(`[AGENT] Started: ${data.name}`);
    });

    agent.on('agentCompleted', (data) => {
      console.log(`[AGENT] Completed: ${data.name} in ${data.executionTime}ms`);
    });

    agent.on('agentError', (data) => {
      console.error(`[AGENT] Error in ${data.name}: ${data.error}`);
    });
  }

  /**
   * Monitoring avec métriques personnalisées
   */
  static withMetrics(agent: Agent, metricsCallback?: (metrics: any) => void): void {
    const metrics = {
      totalAgents: 0,
      totalLLMCalls: 0,
      totalToolCalls: 0,
      totalErrors: 0,
      startTime: Date.now()
    };

    agent.on('agentCreated', () => {
      metrics.totalAgents++;
    });

    agent.on('llmCall', () => {
      metrics.totalLLMCalls++;
    });

    agent.on('toolCalls', () => {
      metrics.totalToolCalls++;
    });

    agent.on('agentError', () => {
      metrics.totalErrors++;
    });

    agent.on('agentCompleted', () => {
      const finalMetrics = {
        ...metrics,
        totalExecutionTime: Date.now() - metrics.startTime
      };
      
      console.log('📊 Métriques finales:', finalMetrics);
      
      if (metricsCallback) {
        metricsCallback(finalMetrics);
      }
    });
  }

  /**
   * Monitoring avec sauvegarde JSON
   */
  static withLogging(agent: Agent, logFile?: string): void {
    const events: any[] = [];
    
    const logEvent = (eventType: string, data: any) => {
      events.push({
        timestamp: new Date().toISOString(),
        eventType,
        data
      });
    };

    agent.on('agentCreated', (data) => logEvent('agentCreated', data));
    agent.on('agentStarted', (data) => logEvent('agentStarted', data));
    agent.on('agentCompleted', (data) => logEvent('agentCompleted', data));
    agent.on('agentError', (data) => logEvent('agentError', data));
    agent.on('llmCall', (data) => logEvent('llmCall', data));
    agent.on('toolCalls', (data) => logEvent('toolCalls', data));
    agent.on('childCreated', (data) => logEvent('childCreated', data));

    agent.on('agentCompleted', () => {
      if (logFile) {
        // Implementation: save to file
        console.log(`📁 Sauvegarde des logs: ${logFile}`);
        // fs.writeFileSync(logFile, JSON.stringify(events, null, 2));
      } else {
        console.log('📋 Logs capturés:', events.length, 'événements');
      }
    });
  }

  /**
   * Monitoring en temps réel avec WebSocket (pour interfaces web)
   */
  static realtime(agent: Agent, websocket?: any): void {
    const sendEvent = (eventType: string, data: any) => {
      const event = {
        timestamp: new Date().toISOString(),
        eventType,
        data
      };

      if (websocket && websocket.readyState === 1) {
        websocket.send(JSON.stringify(event));
      } else {
        // Fallback: console
        console.log(`[REALTIME] ${eventType}:`, data.name || data.id);
      }
    };

    agent.on('agentCreated', (data) => sendEvent('agentCreated', data));
    agent.on('agentStarted', (data) => sendEvent('agentStarted', data));
    agent.on('agentCompleted', (data) => sendEvent('agentCompleted', data));
    agent.on('llmCall', (data) => sendEvent('llmCall', data));
    agent.on('toolCalls', (data) => sendEvent('toolCalls', data));
    agent.on('childCreated', (data) => sendEvent('childCreated', data));
  }

  /**
   * Monitoring personnalisable avec filtres
   */
  static custom(agent: Agent, options: {
    events?: string[];
    filter?: (eventType: string, data: any) => boolean;
    handler?: (eventType: string, data: any) => void;
  }): void {
    const { events = [], filter, handler = console.log } = options;
    
    const defaultEvents = [
      'agentCreated', 'agentStarted', 'agentCompleted', 'agentError',
      'llmCall', 'toolCalls', 'childCreated'
    ];
    
    const eventsToListen = events.length > 0 ? events : defaultEvents;
    
    eventsToListen.forEach(eventName => {
      agent.on(eventName as any, (data: any) => {
        if (!filter || filter(eventName, data)) {
          handler(eventName, data);
        }
      });
    });
  }
}
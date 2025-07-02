# AgenTree Events API

This page documents the AgenTree event system, designed for monitoring, extending, and finely integrating agent behavior.

---

## Event System Architecture

AgenTree uses a strongly typed event system to notify the evolution of the lifecycle of agents, LLM calls, tools, context, and child agents.
Each event carries a structured payload, facilitating supervision, monitoring, extension, or integration with other systems.

Events are typed via the AgentEvents interface, which maps each event name to the signature of its callback.

---

## Event Types

### 1. Agent Lifecycle

- **`agentCreated`**: Agent creation
  Payload: [`AgentEventData`]
- **`agentStarted`**: Agent startup
  Payload: [`AgentEventData`]
- **`agentCompleted`**: Agent completion
  Payload: [`AgentResultEventData`]
- **`agentError`**: Error during execution
  Payload: [`AgentErrorEventData`]

### 2. Execution and Context

- **`contextLoaded`**: Context loading
  Payload: [`ContextLoadEventData`]
- **`llmCall`**: LLM call
  Payload: [`LLMCallEventData`]
- **`toolCalls`**: Tool calls (batch)
  Payload: [`ToolCallEventData`]
- **`toolCallStarted`**: Tool call start
  Payload: [`ToolCallStartedEventData`]
- **`toolCallCompleted`**: Tool call completion
  Payload: [`ToolCallCompletedEventData`]
- **`streamChunk`**: Stream chunk reception
  Payload: [`StreamChunkEventData`]

### 3. Child Agents

- **`childCreated`**: Child agent creation
  Payload: [`ChildAgentEventData`]

---

## Payload Structure

Each event has a structured payload, generally inheriting from [`AgentEventData`]:

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

Specialized events add fields:

- **Result**: `result`, `executionTime`, `success`
- **Error**: `error`, `stack`
- **LLM**: `messageCount`, `availableTools`, `model`
- **Tools**: `toolCalls`, `toolDetails`, `toolName`, `toolInput`, `toolOutput`, `toolError`, `duration`, `toolCallId`
- **Stream**: `chunk`, `accumulatedContent`
- **Context**: `context` (files, URLs, texts)
- **Child Agents**: `parentId`, `parentName`, `childId`, `childName`, `childTask`

---

## Usage: Listening to and Emitting Events

### Listening to Events

To react to an event, subscribe via the agent's event system:

```typescript
agent.on('agentCompleted', (data) => {
  console.log('Agent completed:', data);
});
```

### Emitting Events

Events are generally emitted automatically by the AgenTree core.
To emit a custom event:

```typescript
agent.emit('agentError', {
  id: '...',
  name: '...',
  task: '...',
  depth: 0,
  timestamp: new Date().toISOString(),
  error: 'Error message'
});
```

### Extension: New Events

To extend the system, add a new key to the `AgentEvents` interface and define the associated payload.
Example:

```typescript
interface AgentEvents {
  ...
  'customEvent': (data: CustomEventData) => void;
}
```

---

## Concrete Examples

### Lifecycle Tracking

```typescript
agent.on('agentStarted', (data) => {
  // Log or metric initialization
});
agent.on('agentCompleted', (data) => {
  // Final result processing
});
```

### Tool Monitoring

```typescript
agent.on('toolCallStarted', (data) => {
  console.log(`Tool ${data.toolName} called`);
});
agent.on('toolCallCompleted', (data) => {
  if (data.toolError) {
    console.error('Tool error:', data.toolError);
  }
});
```

---

## Payload Generation

Use the *EventDataBuilder* class to generate consistent payloads:

```typescript
const eventData = EventDataBuilder.createResultEventData(agent, result, 123);
agent.emit('agentCompleted', eventData);
```

---

# Configuration

## Overview

AgenTree provides flexible configuration options for LLM integration, output management, and execution behavior. Configuration can be set through code, environment variables, or configuration files.

## Configuration Interface

```typescript
interface AgentTreeConfig {
  // LLM Configuration
  baseUrl?: string;           // LLM API endpoint
  model?: string;             // Model name
  apiKey?: string;            // API key
  
  // Execution Configuration
  maxDepth?: number;          // Maximum agent hierarchy depth
  streaming?: boolean;        // Enable streaming responses
  
  // Output Configuration
  outputFile?: boolean;       // Generate output files
  outputFolder?: string;      // Output directory
}
```

## LLM Configuration

### OpenAI Configuration

```typescript
const agent = new Agent({
  name: "openai-agent",
  task: "Task description",
  config: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});
```

### OpenAI Models

Available models (as of July 2025):

| Model | Description | Use Case |
|-------|-------------|----------|
| `gpt-4` | Most capable, balanced performance | Complex reasoning, analysis |
| `gpt-4-turbo` | Faster GPT-4 variant | Production workloads |
| `gpt-3.5-turbo` | Fast, cost-effective | Simple tasks, rapid iteration |
| `gpt-4o` | Optimized GPT-4 | Balanced cost/performance |
| `gpt-4o-mini` | Lightweight, fast | Quick tasks, prototyping |

### Azure OpenAI

```typescript
const agent = new Agent({
  name: "azure-agent",
  task: "Task description",
  config: {
    baseUrl: "https://your-resource.openai.azure.com/openai/deployments/your-deployment",
    model: "gpt-4", // Your deployment name
    apiKey: process.env.AZURE_OPENAI_API_KEY
  }
});
```

### Compatible APIs

Any OpenAI-compatible API:

```typescript
const agent = new Agent({
  config: {
    baseUrl: "https://api.anthropic.com/v1",           // Claude
    // baseUrl: "https://api.cohere.ai/v1",            // Cohere
    // baseUrl: "https://api.together.xyz/v1",         // Together AI
    // baseUrl: "http://localhost:11434/v1",           // Ollama
    model: "claude-3-sonnet",
    apiKey: process.env.ANTHROPIC_API_KEY
  }
});
```

## Environment Variables

### Standard Variables

```bash
# OpenAI
export OPENAI_API_KEY="sk-your-api-key"

# Custom endpoint
export LLM_BASE_URL="https://your-llm-endpoint.com/v1"
export LLM_MODEL="gpt-4"
export LLM_API_KEY="your-api-key"

# Output configuration
export AGENTREE_OUTPUT_FOLDER="./agent-logs"
export AGENTREE_MAX_DEPTH="5"
```

### Environment File (.env)

```bash
# .env file
OPENAI_API_KEY=sk-your-api-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4
AGENTREE_OUTPUT_FOLDER=.agentree
AGENTREE_MAX_DEPTH=5
AGENTREE_STREAMING=false
```

Load with dotenv:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const agent = new Agent({
  config: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.LLM_MODEL || "gpt-4",
    baseUrl: process.env.LLM_BASE_URL,
    outputFolder: process.env.AGENTREE_OUTPUT_FOLDER,
    maxDepth: parseInt(process.env.AGENTREE_MAX_DEPTH || "5"),
    streaming: process.env.AGENTREE_STREAMING === "true"
  }
});
```

## Configuration Defaults

### Default Values

```typescript
const defaultConfig: AgentTreeConfig = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4',
  maxDepth: 5,
  outputFile: true,
  outputFolder: '.agentree',
  streaming: false
};
```

### Configuration Merging

```typescript
import { Config } from 'agentree';

// Get default configuration
const defaults = Config.getDefault();

// Merge with custom config
const customConfig = Config.merge({
  model: "gpt-4-turbo",
  maxDepth: 3,
  streaming: true
});

// Use in agent
const agent = new Agent({
  config: customConfig
});
```

## Execution Configuration

### Hierarchy Depth

Control how deep agent decomposition can go:

```typescript
// Shallow hierarchy - broad tasks
const agent = new Agent({
  config: {
    maxDepth: 2, // Parent + 1 level of children
    // ...
  }
});

// Deep hierarchy - granular decomposition
const agent = new Agent({
  config: {
    maxDepth: 6, // Highly specialized agents
    // ...
  }
});
```

**Depth Guidelines:**
- **1-2**: Simple workflows, minimal decomposition
- **3-4**: Standard complex tasks 
- **5-6**: Highly complex projects
- **7+**: Experimental (may hit API limits)

### Streaming Configuration

Enable real-time response streaming:

```typescript
const agent = new Agent({
  config: {
    streaming: true,
    // ...
  }
});

// Monitor streaming
agent.on('streamChunk', (data) => {
  if (data.chunk.content) {
    process.stdout.write(data.chunk.content);
  }
});
```

**Streaming Benefits:**
- Real-time feedback
- Better user experience
- Early error detection

**Streaming Considerations:**
- Slightly higher latency
- More complex error handling
- Network connection sensitivity

## Output Configuration

### Basic Output Settings

```typescript
const agent = new Agent({
  config: {
    outputFile: true,                    // Enable file generation
    outputFolder: './execution-logs',   // Custom folder
    // ...
  }
});
```

### Environment-Based Output

```typescript
const getOutputConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        outputFile: true,
        outputFolder: '/var/log/agentree'
      };
    
    case 'staging':
      return {
        outputFile: true,
        outputFolder: './staging-logs'
      };
    
    case 'development':
      return {
        outputFile: true,
        outputFolder: '.agentree'
      };
    
    case 'test':
      return {
        outputFile: false  // Disable output in tests
      };
    
    default:
      return {
        outputFile: true,
        outputFolder: '.agentree'
      };
  }
};

const agent = new Agent({
  config: {
    ...getOutputConfig(),
    // ... other config
  }
});
```

### Custom Output Paths

```typescript
const agent = new Agent({
  config: {
    outputFile: true,
    outputFolder: `./logs/${new Date().toISOString().split('T')[0]}`, // Daily folders
    // ...
  }
});
```

## Configuration Validation

### Built-in Validation

```typescript
import { Config } from 'agentree';

try {
  const config = Config.merge({
    maxDepth: 15,  // Invalid - too high
    model: "",     // Invalid - empty
    apiKey: null   // Invalid - missing
  });
  
  Config.validate(config);
} catch (error) {
  console.error('Configuration error:', error.message);
  // "maxDepth must be between 1 and 10"
  // "Model is required"
  // "API key is required"
}
```

### Custom Validation

```typescript
const validateConfig = (config: AgentTreeConfig) => {
  if (config.apiKey && !config.apiKey.startsWith('sk-')) {
    throw new Error('OpenAI API key must start with "sk-"');
  }
  
  if (config.outputFolder && !fs.existsSync(path.dirname(config.outputFolder))) {
    throw new Error(`Output folder parent directory does not exist: ${config.outputFolder}`);
  }
  
  if (config.maxDepth && config.maxDepth > 10) {
    console.warn('Warning: High maxDepth may cause performance issues');
  }
};

const config = Config.merge(userConfig);
validateConfig(config);
```

## Configuration Patterns

### Factory Pattern

```typescript
class AgentFactory {
  private baseConfig: AgentTreeConfig;

  constructor(baseConfig: AgentTreeConfig) {
    this.baseConfig = baseConfig;
  }

  createAgent(name: string, task: string, overrides: Partial<AgentTreeConfig> = {}) {
    return new Agent({
      name,
      task,
      config: {
        ...this.baseConfig,
        ...overrides
      }
    });
  }
}

const factory = new AgentFactory({
  model: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
  maxDepth: 3,
  outputFolder: './logs'
});

const agent1 = factory.createAgent("analyzer", "Analyze data");
const agent2 = factory.createAgent("writer", "Write report", { 
  model: "gpt-4-turbo" // Override for this agent
});
```

### Configuration Profiles

```typescript
const profiles = {
  development: {
    model: "gpt-3.5-turbo",
    maxDepth: 2,
    outputFile: true,
    outputFolder: '.agentree',
    streaming: true
  },
  
  staging: {
    model: "gpt-4",
    maxDepth: 4,
    outputFile: true,
    outputFolder: './staging-logs',
    streaming: false
  },
  
  production: {
    model: "gpt-4-turbo",
    maxDepth: 5,
    outputFile: true,
    outputFolder: '/var/log/agentree',
    streaming: false
  }
};

const profile = process.env.NODE_ENV || 'development';
const config = profiles[profile];

const agent = new Agent({
  name: "task-agent",
  task: "Complete task",
  config: {
    apiKey: process.env.OPENAI_API_KEY,
    ...config
  }
});
```

### Dynamic Configuration

```typescript
const getDynamicConfig = async (): Promise<AgentTreeConfig> => {
  // Load from external config service
  const externalConfig = await fetchConfigFromService();
  
  // Load from local config file
  const localConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  
  // Merge with environment variables
  const envConfig = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.LLM_MODEL,
    baseUrl: process.env.LLM_BASE_URL
  };
  
  return Config.merge({
    ...localConfig,
    ...externalConfig,
    ...envConfig
  });
};

const config = await getDynamicConfig();
const agent = new Agent({ config, /* ... */ });
```

## Advanced Configuration

### Custom LLM Client

```typescript
import { LLMClient } from 'agentree';

class CustomLLMClient extends LLMClient {
  async chat(messages, tools, streaming) {
    // Custom implementation
    // Must return { content: string, tool_calls?: ToolCall[] }
  }
  
  async *chatStream(messages, tools) {
    // Custom streaming implementation
    // Must yield { content?: string, tool_calls?: ToolCall[], done: boolean }
  }
}

// Note: Currently requires modification of Agent class
// to accept custom LLM client
```

### Configuration Monitoring

```typescript
const agent = new Agent({
  config: {
    model: "gpt-4",
    maxDepth: 5,
    // ...
  }
});

// Log configuration on startup
agent.on('agentStarted', (data) => {
  if (data.depth === 0) {
    console.log('🔧 Configuration:');
    console.log(`   Model: ${agent.config.model}`);
    console.log(`   Max Depth: ${agent.config.maxDepth}`);
    console.log(`   Output: ${agent.config.outputFile ? 'Enabled' : 'Disabled'}`);
    console.log(`   Streaming: ${agent.config.streaming ? 'Enabled' : 'Disabled'}`);
  }
});
```

## Configuration Security

### Secure API Key Handling

```typescript
// Good: Environment variables
const config = {
  apiKey: process.env.OPENAI_API_KEY,
  // ...
};

// Poor: Hardcoded keys
const config = {
  apiKey: "sk-hardcoded-key-never-do-this",
  // ...
};

// Better: Key management service
import { getSecretValue } from './key-management';

const config = {
  apiKey: await getSecretValue('openai-api-key'),
  // ...
};
```

### Environment Separation

```typescript
// Separate configs for different environments
const configs = {
  development: {
    apiKey: process.env.DEV_OPENAI_API_KEY,
    baseUrl: "https://api.openai.com/v1"
  },
  
  production: {
    apiKey: process.env.PROD_OPENAI_API_KEY,
    baseUrl: process.env.PROD_LLM_ENDPOINT // Different endpoint
  }
};

const env = process.env.NODE_ENV || 'development';
const config = configs[env];
```

### Configuration Validation for Security

```typescript
const validateSecureConfig = (config: AgentTreeConfig) => {
  // Ensure API key is not exposed
  if (config.apiKey && config.apiKey.length < 10) {
    throw new Error('API key appears to be invalid or test key');
  }
  
  // Validate base URL
  if (config.baseUrl && !config.baseUrl.startsWith('https://')) {
    console.warn('Warning: Using non-HTTPS endpoint may be insecure');
  }
  
  // Check for test/development keys in production
  if (process.env.NODE_ENV === 'production' && 
      config.apiKey?.includes('test')) {
    throw new Error('Test API key detected in production environment');
  }
};
```

## Troubleshooting

### Common Configuration Issues

#### Invalid API Key
```
Error: API key is required
```
**Solution:** Set `OPENAI_API_KEY` environment variable or pass in config

#### Model Not Found
```
Error: Model 'gpt-5' not found
```
**Solution:** Use valid model name (gpt-4, gpt-3.5-turbo, etc.)

#### Permission Denied
```
Error: EACCES: permission denied, mkdir '/var/log/agentree'
```
**Solution:** Use writable output folder or fix permissions

#### Network Issues
```
Error: connect ENOTFOUND api.openai.com
```
**Solution:** Check network connection and proxy settings

### Debug Configuration

```typescript
const agent = new Agent({
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY,
    // ...
  }
});

// Debug configuration
console.log('Configuration:', {
  model: agent.config.model,
  hasApiKey: !!agent.config.apiKey,
  apiKeyPrefix: agent.config.apiKey?.substring(0, 7) + '...',
  baseUrl: agent.config.baseUrl,
  maxDepth: agent.config.maxDepth,
  outputEnabled: agent.config.outputFile
});
```

## Next Steps

- [Debugging](/guide/debugging) - Debug configuration issues
- [API Reference - Config](/api/config-options) - Complete configuration reference
- [Examples](/examples/) - See configuration in different scenarios
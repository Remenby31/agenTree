# Configuration Options

## Overview

AgenTree configuration controls LLM integration, execution behavior, and output generation. Configuration can be set through the `AgentTreeConfig` interface.

## AgentTreeConfig Interface

```typescript
interface AgentTreeConfig {
  // LLM Configuration
  baseUrl?: string;           // LLM API endpoint URL
  model?: string;             // Model name to use
  apiKey?: string;            // API authentication key
  
  // Execution Configuration
  maxDepth?: number;          // Maximum agent hierarchy depth
  streaming?: boolean;        // Enable streaming responses
  
  // Output Configuration
  outputFile?: boolean;       // Generate output files
  outputFolder?: string;      // Output directory path
}
```

## Default Configuration

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

## Configuration Options

### LLM Configuration

#### baseUrl

**Type:** `string`  
**Default:** `'https://api.openai.com/v1'`  
**Description:** Base URL for the LLM API endpoint

```typescript
// OpenAI (default)
baseUrl: 'https://api.openai.com/v1'

// Azure OpenAI
baseUrl: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment'

// Custom endpoint
baseUrl: 'https://api.anthropic.com/v1'

// Local endpoint (Ollama)
baseUrl: 'http://localhost:11434/v1'
```

**Environment Variable:** `LLM_BASE_URL`

#### model

**Type:** `string`  
**Default:** `'gpt-4'`  
**Description:** LLM model name to use for all agents

```typescript
// OpenAI models
model: 'gpt-4'              // Most capable, balanced
model: 'gpt-4-turbo'        // Faster GPT-4 variant
model: 'gpt-4o'             // Optimized GPT-4
model: 'gpt-4o-mini'        // Lightweight, fast
model: 'gpt-3.5-turbo'      // Fast, cost-effective

// Azure OpenAI (use deployment name)
model: 'your-gpt4-deployment'

// Other providers
model: 'claude-3-sonnet'    // Anthropic
model: 'llama2'             // Ollama
```

**Environment Variable:** `LLM_MODEL`

#### apiKey

**Type:** `string`  
**Required:** Yes (unless using local models)  
**Description:** API key for LLM service authentication

```typescript
// From environment variable (recommended)
apiKey: process.env.OPENAI_API_KEY

// Direct assignment (not recommended)
apiKey: 'sk-your-api-key'
```

**Environment Variables:**
- `OPENAI_API_KEY` (automatically used if present)
- `LLM_API_KEY` (fallback)

### Execution Configuration

#### maxDepth

**Type:** `number`  
**Default:** `5`  
**Range:** `1-10`  
**Description:** Maximum depth of agent hierarchy (parent + children levels)

```typescript
// Shallow hierarchy - minimal decomposition
maxDepth: 1   // No child agents
maxDepth: 2   // Parent + 1 level of children

// Standard hierarchy - typical use
maxDepth: 3   // Parent + 2 levels (common for most tasks)
maxDepth: 5   // Parent + 4 levels (default, good balance)

// Deep hierarchy - complex decomposition
maxDepth: 7   // Highly specialized agents
maxDepth: 10  // Maximum allowed (use with caution)
```

**Environment Variable:** `AGENTREE_MAX_DEPTH`

**Guidelines:**
- **1-2:** Simple workflows, direct execution
- **3-4:** Standard complex tasks
- **5-6:** Highly complex projects
- **7+:** Experimental use (may hit API limits)

#### streaming

**Type:** `boolean`  
**Default:** `false`  
**Description:** Enable real-time streaming of LLM responses

```typescript
// Disabled (default) - wait for complete responses
streaming: false

// Enabled - receive responses as they're generated
streaming: true
```

**Environment Variable:** `AGENTREE_STREAMING`

**Benefits of streaming:**
- Real-time feedback during execution
- Better user experience for long tasks
- Early detection of issues

**Considerations:**
- Slightly more complex error handling
- May increase API latency
- Requires stable network connection

### Output Configuration

#### outputFile

**Type:** `boolean`  
**Default:** `true`  
**Description:** Enable automatic generation of execution reports and logs

```typescript
// Enabled (default) - generate comprehensive reports
outputFile: true

// Disabled - no file output (useful for testing)
outputFile: false
```

**Environment Variable:** `AGENTREE_OUTPUT_FILE`

**Generated files when enabled:**
- `agent-report.md` - Human-readable execution summary
- `conversation.md` - Complete LLM conversation log  
- `execution-log.json` - Machine-readable event stream
- `metadata.json` - Agent configuration and status

#### outputFolder

**Type:** `string`  
**Default:** `'.agentree'`  
**Description:** Directory path for generated output files

```typescript
// Default - current directory
outputFolder: '.agentree'

// Absolute path
outputFolder: '/var/log/agentree'

// Relative path
outputFolder: './logs/agents'

// Environment-based
outputFolder: process.env.NODE_ENV === 'production' 
  ? '/var/log/agentree' 
  : '.agentree'

// Dynamic path
outputFolder: `./logs/${new Date().toISOString().split('T')[0]}`
```

**Environment Variable:** `AGENTREE_OUTPUT_FOLDER`

## Configuration Usage

### Basic Configuration

```typescript
import { Agent } from 'agentree';

const agent = new Agent({
  name: 'my-agent',
  task: 'Complete a task',
  config: {
    model: 'gpt-4-turbo',
    apiKey: process.env.OPENAI_API_KEY,
    maxDepth: 3,
    outputFile: true,
    outputFolder: './reports'
  }
});
```

### Configuration with Defaults

```typescript
import { Config } from 'agentree';

// Get default configuration
const defaults = Config.getDefault();

// Merge with custom settings
const config = Config.merge({
  model: 'gpt-4-turbo',
  maxDepth: 3,
  streaming: true
});

// Use merged configuration
const agent = new Agent({
  name: 'configured-agent',
  task: 'Task with custom config',
  config
});
```

### Environment-Based Configuration

```typescript
const getConfig = (): AgentTreeConfig => {
  return {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || 'gpt-4',
    apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
    maxDepth: parseInt(process.env.AGENTREE_MAX_DEPTH || '5'),
    streaming: process.env.AGENTREE_STREAMING === 'true',
    outputFile: process.env.AGENTREE_OUTPUT_FILE !== 'false',
    outputFolder: process.env.AGENTREE_OUTPUT_FOLDER || '.agentree'
  };
};

const agent = new Agent({
  name: 'env-configured-agent',
  task: 'Task with environment configuration',
  config: getConfig()
});
```

## Configuration Validation

### Built-in Validation

```typescript
import { Config } from 'agentree';

try {
  const config = Config.merge({
    maxDepth: 15,    // Invalid - exceeds maximum
    model: '',       // Invalid - empty string
    apiKey: undefined // Invalid - missing API key
  });
  
  Config.validate(config);
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

**Validation Rules:**
- `apiKey` is required (unless using local models)
- `model` cannot be empty
- `maxDepth` must be between 1 and 10
- `baseUrl` must be a valid URL format
- `outputFolder` parent directory must exist

### Custom Validation

```typescript
const validateCustomConfig = (config: AgentTreeConfig) => {
  // API key format validation
  if (config.apiKey && !config.apiKey.startsWith('sk-')) {
    throw new Error('OpenAI API key must start with "sk-"');
  }
  
  // URL security validation
  if (config.baseUrl && !config.baseUrl.startsWith('https://')) {
    console.warn('Warning: Non-HTTPS endpoint may be insecure');
  }
  
  // Performance warnings
  if (config.maxDepth && config.maxDepth > 7) {
    console.warn('Warning: High maxDepth may cause performance issues');
  }
  
  // Environment-specific validation
  if (process.env.NODE_ENV === 'production') {
    if (config.apiKey?.includes('test')) {
      throw new Error('Test API key detected in production');
    }
    if (config.outputFolder && !config.outputFolder.startsWith('/')) {
      console.warn('Warning: Relative paths in production may cause issues');
    }
  }
};

const config = Config.merge(userConfig);
validateCustomConfig(config);
```

## Configuration Patterns

### Environment Profiles

```typescript
const configProfiles = {
  development: {
    model: 'gpt-3.5-turbo',     // Faster, cheaper for dev
    maxDepth: 2,                // Shallow for quick testing
    streaming: true,            // Real-time feedback
    outputFile: true,           // Debug information
    outputFolder: '.agentree'
  },
  
  testing: {
    model: 'gpt-3.5-turbo',
    maxDepth: 2,
    streaming: false,           // Consistent for tests
    outputFile: false,          // No file clutter
    outputFolder: '/tmp/agentree'
  },
  
  staging: {
    model: 'gpt-4',
    maxDepth: 4,
    streaming: false,
    outputFile: true,
    outputFolder: './staging-logs'
  },
  
  production: {
    model: 'gpt-4-turbo',       // Optimal performance
    maxDepth: 5,                // Full capability
    streaming: false,           // Reliability over speed
    outputFile: true,           // Audit trail
    outputFolder: '/var/log/agentree'
  }
};

const env = process.env.NODE_ENV || 'development';
const profileConfig = configProfiles[env];

const config = Config.merge({
  apiKey: process.env.OPENAI_API_KEY,
  ...profileConfig
});
```

### Dynamic Configuration

```typescript
class ConfigManager {
  private static cache: AgentTreeConfig | null = null;
  
  static async getConfig(): Promise<AgentTreeConfig> {
    if (this.cache) {
      return this.cache;
    }
    
    // Load from multiple sources
    const [envConfig, fileConfig, remoteConfig] = await Promise.all([
      this.loadFromEnvironment(),
      this.loadFromFile(),
      this.loadFromRemoteService()
    ]);
    
    // Merge configurations (env takes precedence)
    this.cache = Config.merge({
      ...fileConfig,
      ...remoteConfig,
      ...envConfig
    });
    
    return this.cache;
  }
  
  private static loadFromEnvironment(): AgentTreeConfig {
    return {
      baseUrl: process.env.LLM_BASE_URL,
      model: process.env.LLM_MODEL,
      apiKey: process.env.OPENAI_API_KEY,
      maxDepth: process.env.AGENTREE_MAX_DEPTH ? 
        parseInt(process.env.AGENTREE_MAX_DEPTH) : undefined,
      streaming: process.env.AGENTREE_STREAMING === 'true',
      outputFile: process.env.AGENTREE_OUTPUT_FILE !== 'false',
      outputFolder: process.env.AGENTREE_OUTPUT_FOLDER
    };
  }
  
  private static async loadFromFile(): Promise<AgentTreeConfig> {
    try {
      const configPath = process.env.AGENTREE_CONFIG_FILE || './agentree.config.json';
      const content = await fs.readFile(configPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  
  private static async loadFromRemoteService(): Promise<AgentTreeConfig> {
    // Implementation for loading from config service
    return {};
  }
  
  static clearCache() {
    this.cache = null;
  }
}

// Usage
const config = await ConfigManager.getConfig();
const agent = new Agent({ config, /* ... */ });
```

### Factory Pattern

```typescript
class AgentFactory {
  constructor(private baseConfig: AgentTreeConfig) {}
  
  createAgent(
    name: string, 
    task: string, 
    overrides: Partial<AgentTreeConfig> = {}
  ): Agent {
    const config = Config.merge({
      ...this.baseConfig,
      ...overrides
    });
    
    return new Agent({ name, task, config });
  }
  
  // Specialized factory methods
  createQuickAgent(name: string, task: string): Agent {
    return this.createAgent(name, task, {
      model: 'gpt-3.5-turbo',
      maxDepth: 2,
      outputFile: false
    });
  }
  
  createAnalysisAgent(name: string, task: string): Agent {
    return this.createAgent(name, task, {
      model: 'gpt-4',
      maxDepth: 4,
      outputFolder: './analysis-reports'
    });
  }
  
  createProductionAgent(name: string, task: string): Agent {
    return this.createAgent(name, task, {
      model: 'gpt-4-turbo',
      maxDepth: 5,
      streaming: false,
      outputFolder: '/var/log/agentree'
    });
  }
}

// Usage
const factory = new AgentFactory({
  apiKey: process.env.OPENAI_API_KEY,
  outputFile: true
});

const quickAgent = factory.createQuickAgent('test', 'Quick test');
const analysisAgent = factory.createAnalysisAgent('analyzer', 'Analyze data');
const prodAgent = factory.createProductionAgent('prod', 'Production task');
```

## Configuration Security

### Secure API Key Management

```typescript
// Good: Environment variables
const config = {
  apiKey: process.env.OPENAI_API_KEY
};

// Better: Key management service
import { SecretManager } from './security';

const config = {
  apiKey: await SecretManager.getSecret('openai-api-key')
};

// Best: Role-based access with rotation
const config = {
  apiKey: await SecretManager.getSecret('openai-api-key', {
    role: 'agentree-service',
    autoRotate: true
  })
};
```

### Environment Separation

```typescript
const secureConfig = {
  development: {
    apiKey: process.env.DEV_OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1'
  },
  
  production: {
    apiKey: process.env.PROD_OPENAI_API_KEY,
    baseUrl: process.env.PROD_LLM_ENDPOINT,
    // Additional security headers, etc.
  }
};

const env = process.env.NODE_ENV || 'development';
const config = secureConfig[env];

// Validate security in production
if (env === 'production') {
  if (!config.baseUrl?.startsWith('https://')) {
    throw new Error('Production must use HTTPS');
  }
  if (config.apiKey?.length < 32) {
    throw new Error('Production API key appears invalid');
  }
}
```

## Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENAI_API_KEY` | `string` | - | OpenAI API key (primary) |
| `LLM_API_KEY` | `string` | - | LLM API key (fallback) |
| `LLM_BASE_URL` | `string` | `https://api.openai.com/v1` | LLM endpoint URL |
| `LLM_MODEL` | `string` | `gpt-4` | Model name |
| `AGENTREE_MAX_DEPTH` | `number` | `5` | Maximum hierarchy depth |
| `AGENTREE_STREAMING` | `boolean` | `false` | Enable streaming |
| `AGENTREE_OUTPUT_FILE` | `boolean` | `true` | Generate output files |
| `AGENTREE_OUTPUT_FOLDER` | `string` | `.agentree` | Output directory |

### Example .env File

```text
# LLM Configuration
OPENAI_API_KEY=sk-your-openai-api-key
LLM_MODEL=gpt-4-turbo
LLM_BASE_URL=https://api.openai.com/v1

# Execution Configuration
AGENTREE_MAX_DEPTH=4
AGENTREE_STREAMING=false

# Output Configuration
AGENTREE_OUTPUT_FILE=true
AGENTREE_OUTPUT_FOLDER=./agent-logs

# Environment
NODE_ENV=development
```

## Troubleshooting

### Common Configuration Issues

#### Invalid API Key

```
Error: API key is required
```

**Solutions:**
- Set `OPENAI_API_KEY` environment variable
- Pass `apiKey` in config object
- Verify API key format (should start with 'sk-')

#### Model Not Available

```
Error: Model 'invalid-model' not found
```

**Solutions:**
- Use valid model name (gpt-4, gpt-3.5-turbo, etc.)
- Check model availability in your region
- Verify API key has access to the model

#### Output Directory Issues

```
Error: ENOENT: no such file or directory
```

**Solutions:**
- Create output directory: `mkdir -p .agentree`
- Use absolute path: `/var/log/agentree`
- Check directory permissions

#### Network/URL Issues

```
Error: connect ENOTFOUND api.example.com
```

**Solutions:**
- Verify `baseUrl` is correct
- Check network connectivity
- Verify proxy settings if behind corporate firewall

### Debug Configuration

```typescript
const debugConfig = (config: AgentTreeConfig) => {
  console.log('📋 Configuration Debug:');
  console.log('  Model:', config.model);
  console.log('  Base URL:', config.baseUrl);
  console.log('  API Key:', config.apiKey ? 
    `${config.apiKey.substring(0, 7)}...` : 'NOT SET');
  console.log('  Max Depth:', config.maxDepth);
  console.log('  Streaming:', config.streaming);
  console.log('  Output File:', config.outputFile);
  console.log('  Output Folder:', config.outputFolder);
  
  // Validate configuration
  try {
    Config.validate(config);
    console.log('  ✅ Configuration valid');
  } catch (error) {
    console.log('  ❌ Configuration invalid:', error.message);
  }
};

const config = Config.merge(userConfig);
debugConfig(config);
```

## See Also

- [Agent Class](/api/agent-class) - Using configuration with agents
- [Environment Setup](/guide/installation) - Setting up environment variables
- [Debugging](/guide/debugging) - Debug configuration issues
- [Examples](/examples/) - Configuration examples in practice

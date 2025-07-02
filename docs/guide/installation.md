# Installation

## Requirements

- **Node.js** 18+ 
- **TypeScript** 5+
- **LLM API key** (OpenAI or compatible)

## Package Installation

```bash
npm install agentree zod
```

### Dependencies

- **zod**: Schema validation for tool parameters
- **openai**: LLM client (automatically installed)
- **fs-extra**: File system operations
- **uuid**: Agent ID generation

## Environment Setup

### OpenAI Configuration

```bash
export OPENAI_API_KEY="sk-your-api-key"
```

### Custom LLM Endpoint

```bash
export OPENAI_API_KEY="your-api-key"
export LLM_BASE_URL="https://your-llm-endpoint.com/v1"
```

### Environment File

Create `.env` in your project root:

```env
OPENAI_API_KEY=sk-your-api-key
LLM_BASE_URL=https://api.openai.com/v1
```

## TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Verification

Test your installation:

```typescript
import { Agent } from 'agentree';

const agent = new Agent({
  name: "test",
  task: "Say hello",
  config: {
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY
  }
});

console.log("AgenTree installed successfully!");
```

## Troubleshooting

### API Key Issues

```bash
# Verify environment variable
echo $OPENAI_API_KEY

# Test API access
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

### TypeScript Errors

Ensure you have the correct TypeScript version:

```bash
npm install -D typescript@^5.0.0
```

### Module Resolution

If you encounter import errors:

```bash
npm install --save-dev @types/node
```

## Next Steps

- [Basic Usage](/guide/basic-usage) - Create your first agent
- [Configuration](/guide/configuration) - Detailed configuration options
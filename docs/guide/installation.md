# Installation

```bash
npm install agentree zod
```

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

```bash
OPENAI_API_KEY=sk-your-api-key
LLM_BASE_URL=https://api.openai.com/v1
```

## Next Steps

- [Basic Usage](/guide/basic-usage) - Create your first agent
- [Configuration](/guide/configuration) - Detailed configuration options
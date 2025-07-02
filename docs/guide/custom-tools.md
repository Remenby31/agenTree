# Translating Custom Tools

Translating custom tools in AgenTree involves translating the tool's description. Currently, AgenTree does not provide a built-in translation mechanism. However, you can implement your own translation solution using a translation library such as `i18next` or `lingui`.

Here's an example of how you can translate a tool's description:

```typescript
import { tool } from 'src/tools/ToolHelper';
import { z } from 'zod';
import i18next from 'i18next';

// Initialize i18next (or another translation library)
i18next.init({
  lng: 'en', // Default language
  resources: {
    en: {
      translation: {
        'searchTool.description': 'Tool to perform web searches.',
      },
    },
  },
});

const searchTool = tool({
  name: 'searchTool',
  description: i18next.t('searchTool.description'),
  parameters: z.object({
    query: z.string().describe('The search query.'),
  }),
  execute: async (args) => {
    // Search tool implementation
    return `Searching for ${args.query}`;
  },
});
```

In this example, we use `i18next` to translate the description of the `searchTool` tool. The description is stored in a translation file and retrieved using the `i18next.t()` function.

You can also translate the descriptions of the tool's parameters using the `describe()` method of `zod`.

```typescript
import { tool } from 'src/tools/ToolHelper';
import { z } from 'zod';
import i18next from 'i18next';

// Initialize i18next (or another translation library)
i18next.init({
  lng: 'en', // Default language
  resources: {
    en: {
      translation: {
        'searchTool.query.description': 'The search term.',
      },
    },
  },
});

const searchTool = tool({
  name: 'searchTool',
  description: 'Tool to perform web searches.',
  parameters: z.object({
    query: z.string().describe(i18next.t('searchTool.query.description')),
  }),
  execute: async (args) => {
    // Search tool implementation
    return `Searching for ${args.query}`;
  },
});
```

In this example, we translate the description of the `query` parameter of the `searchTool` tool.

In summary, to translate custom tools in AgenTree, you need to:

1.  Choose a translation library.
2.  Initialize the translation library.
3.  Store the descriptions of the tools and parameters in translation files.
4.  Retrieve the translated descriptions using the translation library.
5.  Use the translated descriptions when creating the tool.

Remember to adapt the code examples to your own configuration and preferred translation library.
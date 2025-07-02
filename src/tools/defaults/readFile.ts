import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';

const readFileSchema = z.object({
  path: z.string().describe("Chemin vers le fichier à lire"),
});

export const readFileTool = tool({
  name: 'readFile',
  description: 'Lit le contenu d\'un fichier',
  parameters: readFileSchema,
  execute: async (args) => {
    const { path } = args;
    if (!await fs.pathExists(path)) {
      throw new Error(`Le fichier ${path} n'existe pas`);
    }
    const content = await fs.readFile(path, 'utf-8');
    return content;
  }
});
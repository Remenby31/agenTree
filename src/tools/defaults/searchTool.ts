import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';
import * as path from 'path';

const searchToolSchema = z.object({
  query: z.string().describe("Texte ou regex à rechercher"),
  extensions: z.array(z.string()).optional().describe("Extensions de fichiers à inclure, ex: ['.ts', '.js']"),
  root: z.string().optional().describe("Dossier racine pour la recherche (défaut: '.')"),
});

async function searchInFiles(root: string, query: string, extensions?: string[]) {
  const results: { file: string; matches: string[] }[] = [];
  const files: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (
        !extensions ||
        extensions.some(ext => entry.name.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  }

  await walk(root);

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const matches = content.match(new RegExp(query, 'g')) || [];
    if (matches.length > 0) {
      results.push({ file, matches });
    }
  }
  return results;
}

export const searchTool = tool({
  name: 'searchTool',
  description: 'Recherche un texte ou une regex dans tous les fichiers, avec filtrage par extension possible',
  parameters: searchToolSchema,
  execute: async (args) => {
    const { query, extensions, root } = args;
    const res = await searchInFiles(root || '.', query, extensions);
    return JSON.stringify(res, null, 2);
  }
});
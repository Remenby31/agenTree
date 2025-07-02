import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';

const replaceFileSchema = z.object({
  path: z.string().describe("Chemin du fichier à modifier"),
  search: z.string().describe("Texte ou regex à remplacer"),
  replace: z.string().describe("Nouveau texte"),
  useRegex: z.boolean().optional().default(false).describe("Utiliser une regex pour la recherche"),
});

export const replaceFileTool = tool({
  name: 'replaceFile',
  description: 'Remplace une partie du texte dans un fichier (supporte regex)',
  parameters: replaceFileSchema,
  execute: async (args) => {
    const { path: filePath, search, replace, useRegex } = args;
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Le fichier ${filePath} n'existe pas`);
    }
    let content = await fs.readFile(filePath, 'utf-8');
    let newContent;
    if (useRegex) {
      newContent = content.replace(new RegExp(search, 'g'), replace);
    } else {
      newContent = content.split(search).join(replace);
    }
    await fs.writeFile(filePath, newContent, 'utf-8');
    return `Remplacement effectué dans ${filePath}`;
  }
});
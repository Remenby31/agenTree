import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';
import * as path from 'path';

const writeFileSchema = z.object({
  path: z.string().describe("Chemin du fichier à créer"),
  content: z.string().describe("Contenu à écrire dans le fichier"),
  overwrite: z.boolean().optional().default(false).describe("Autoriser l'écrasement si le fichier existe"),
});

export const writeFileTool = tool({
  name: 'writeFile',
  description: 'Crée et écrit un nouveau fichier. Si le fichier existe déjà et que l’agent ne l’a pas lu, renvoie une erreur sauf si overwrite=true',
  parameters: writeFileSchema,
  execute: async (args) => {
    const { path: filePath, content, overwrite } = args;
    if (await fs.pathExists(filePath) && !overwrite) {
      throw new Error(`Le fichier ${filePath} existe déjà. Utilisez overwrite=true pour l’écraser.`);
    }
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return `Fichier ${filePath} créé avec succès (${content.length} caractères)`;
  },
  errorFunction: (context, error) => {
    return `Erreur lors de l'écriture du fichier: ${error.message}`;
  }
});
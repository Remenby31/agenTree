# API des outils AgenTree

Cette page documente l’architecture, l’interface et l’extension du système d’outils d’AgenTree, à destination des développeurs.

---

## Architecture générale

Le système d’outils d’AgenTree repose sur :
- Une interface normalisée pour chaque outil (`Tool`)
- Un registre centralisé (`ToolRegistry`) pour l’enregistrement et la découverte
- Un utilitaire de création d’outils (`tool`) facilitant la validation des paramètres et l’intégration

### Interfaces principales

#### [`ToolOptions<T>`](../../src/tools/ToolHelper.ts#L3)
Décrit les options nécessaires à la création d’un outil :
- `name?` : nom de l’outil (optionnel, sinon déduit)
- `description` : description textuelle
- `parameters` : schéma Zod des paramètres attendus
- `strict?` : validation stricte (par défaut : true)
- `execute` : fonction asynchrone exécutant l’outil
- `errorFunction?` : gestionnaire d’erreur personnalisé

#### [`Tool`](../../src/tools/ToolHelper.ts#L12)
Représente un outil enregistré :
- `name` : nom unique
- `description` : description
- `parameters` : schéma JSON Schema dérivé du schéma Zod
- `execute(args, context?)` : exécution de l’outil
- `errorFunction?` : gestionnaire d’erreur

#### [`ToolRegistry`](../../src/tools/ToolRegistry.ts#L3)
Registre statique centralisant tous les outils :
- `register(tool)` : enregistre un outil
- `get(name)` : récupère un outil par son nom
- `list()` : liste les noms d’outils enregistrés
- `clear()` : vide le registre
- `has(name)` : vérifie la présence d’un outil
- `getAll()` : retourne tous les outils

---

## Création d’un outil

Utilisez la fonction [`tool`](../../src/tools/ToolHelper.ts#L106) pour transformer une configuration en un objet `Tool` conforme :

```typescript
import { z } from 'zod';
import { tool } from 'src/tools/ToolHelper';

const myToolSchema = z.object({
  input: z.string().describe("Entrée à traiter"),
});

const myTool = tool({
  name: 'myTool',
  description: 'Un outil exemple',
  parameters: myToolSchema,
  execute: async (args) => {
    // Traitement
    return `Entrée : ${args.input}`;
  }
});
```

La validation des paramètres est automatique (via Zod) si `strict` est à `true`.

---

## Enregistrement et utilisation

Pour rendre un outil disponible dans AgenTree, il doit être enregistré :

```typescript
import { ToolRegistry } from 'src/tools/ToolRegistry';

ToolRegistry.register(myTool);
```

L’outil peut ensuite être retrouvé et utilisé dynamiquement :

```typescript
const tool = ToolRegistry.get('myTool');
if (tool) {
  const result = await tool.execute({ input: 'test' });
  // ...
}
```

---

## Extension : créer un outil personnalisé

Exemple : outil de lecture de fichier ([`readFileTool`](../../src/tools/defaults/readFile.ts#L9)) :

```typescript
import { z } from 'zod';
import { tool } from 'src/tools/ToolHelper';
import * as fs from 'fs-extra';

const readFileSchema = z.object({
  path: z.string().describe("Chemin vers le fichier à lire"),
});

export const readFileTool = tool({
  name: 'readFile',
  description: "Lit le contenu d'un fichier",
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
```

---

## Gestion des schémas de paramètres

Les schémas de paramètres sont définis avec [Zod](https://zod.dev/) et convertis automatiquement en JSON Schema pour l’API.  
Les types supportés incluent : chaînes, nombres, booléens, objets, tableaux, énumérations, champs optionnels et valeurs par défaut.

---

## Bonnes pratiques

- Utilisez des descriptions explicites pour chaque paramètre
- Gérez les erreurs via `errorFunction` si besoin
- Privilégiez la validation stricte pour la robustesse
- Enregistrez vos outils au démarrage de l’application

---

## Voir aussi

- [Types et interfaces de base](./types.md)
- [Outils intégrés](./built-in-tools.md)
- [Guide d’extension des outils](../guide/custom-tools.md)
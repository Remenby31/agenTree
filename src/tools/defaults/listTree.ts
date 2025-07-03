import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';
import * as path from 'path';

const listTreeSchema = z.object({
  path: z.string().optional().describe("Chemin du répertoire à analyser (défaut: répertoire courant)"),
  maxDepth: z.number().optional().default(5).describe("Profondeur maximale de l'arbre"),
  includeHidden: z.boolean().optional().default(false).describe("Inclure les fichiers cachés"),
  customIgnore: z.array(z.string()).optional().describe("Dossiers supplémentaires à ignorer")
});

// Dossiers à ignorer par défaut
const DEFAULT_IGNORE_FOLDERS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  'coverage',
  '.nyc_output',
  '.cache',
  '.vscode',
  '.idea',
  'tmp',
  'temp',
  '.DS_Store',
  'Thumbs.db'
];

// Extensions de fichiers texte pour le comptage des lignes
const TEXT_EXTENSIONS = [
  '.ts', '.js', '.tsx', '.jsx', '.json', '.md', '.txt', '.css', '.scss', '.html',
  '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.py', '.java',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift',
  '.kt', '.sql', '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd'
];

interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  lines?: number;
  size?: number;
  type?: string;
}

function getFileType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap: { [key: string]: string } = {
    '.ts': 'TypeScript',
    '.js': 'JavaScript',
    '.tsx': 'TypeScript React',
    '.jsx': 'JavaScript React',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.py': 'Python',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.cs': 'C#',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.bash': 'Bash',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.xml': 'XML',
    '.toml': 'TOML'
  };
  return typeMap[ext] || 'Text';
}

async function countLines(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    // Si on ne peut pas lire le fichier comme texte, retourner 0
    return 0;
  }
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

async function scanDirectory(
  dirPath: string,
  ignoreList: string[],
  includeHidden: boolean,
  maxDepth: number,
  currentDepth: number = 0
): Promise<FileInfo[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const items: FileInfo[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      // Ignorer les fichiers/dossiers cachés (commençant par .) si pas demandé explicitement
      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }
      
      // Ignorer les dossiers dans la liste d'ignore
      if (entry.isDirectory() && ignoreList.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        const subItems = await scanDirectory(
          fullPath,
          ignoreList,
          includeHidden,
          maxDepth,
          currentDepth + 1
        );
        
        items.push({
          name: entry.name,
          path: relativePath,
          isDirectory: true
        });
        
        items.push(...subItems);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const isTextFile = TEXT_EXTENSIONS.includes(ext);
        
        let lines = 0;
        let size = 0;
        
        if (isTextFile) {
          lines = await countLines(fullPath);
        } else {
          size = await getFileSize(fullPath);
        }
        
        items.push({
          name: entry.name,
          path: relativePath,
          isDirectory: false,
          lines: isTextFile ? lines : undefined,
          size: isTextFile ? undefined : size,
          type: getFileType(entry.name)
        });
      }
    }
  } catch (error) {
    // Ignorer les erreurs d'accès aux dossiers
  }
  
  return items;
}

function formatTree(items: FileInfo[], basePath: string): string {
  const result: string[] = [];
  
  // Construire un arbre hiérarchique
  const tree: { [key: string]: FileInfo[] } = {};
  
  // Organiser les éléments par parent
  items.forEach(item => {
    const parentPath = path.dirname(item.path);
    const normalizedParent = parentPath === '.' ? '' : parentPath;
    
    if (!tree[normalizedParent]) {
      tree[normalizedParent] = [];
    }
    tree[normalizedParent].push(item);
  });
  
  // Trier chaque niveau
  Object.keys(tree).forEach(key => {
    tree[key].sort((a, b) => {
      // Dossiers avant fichiers
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      // Puis alphabétiquement
      return a.name.localeCompare(b.name);
    });
  });
  
  result.push('PROJECT_STRUCTURE:');
  result.push(basePath + '/');
  
  // Fonction récursive pour afficher l'arbre
  function renderLevel(parentPath: string, depth: number) {
    const items = tree[parentPath] || [];
    
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const prefix = depth === 0 ? '' : '│   '.repeat(depth - 1) + (isLast ? '└── ' : '├── ');
      
      if (item.isDirectory) {
        result.push(`${prefix}${item.name}/`);
        // Récursion pour les sous-dossiers
        renderLevel(item.path, depth + 1);
      } else {
        let fileInfo = `${prefix}${item.name}`;
        
        if (item.lines !== undefined) {
          fileInfo += ` [${item.lines} lines]`;
        } else if (item.size !== undefined) {
          const sizeStr = item.size > 1024 
            ? `${Math.round(item.size / 1024)}KB`
            : `${item.size}B`;
          fileInfo += ` [${sizeStr}]`;
        }
        
        if (item.type) {
          fileInfo += ` [${item.type}]`;
        }
        
        result.push(fileInfo);
      }
    });
  }
  
  // Commencer au niveau racine
  renderLevel('', 0);
  
  // Ajouter les dossiers ignorés
  const ignoredInfo = DEFAULT_IGNORE_FOLDERS.filter(folder => 
    fs.existsSync(path.join(process.cwd(), folder))
  );
  
  if (ignoredInfo.length > 0) {
    result.push('');
    result.push(`[IGNORED: ${ignoredInfo.join(', ')}]`);
  }
  
  return result.join('\n');
}

export const listTreeTool = tool({
  name: 'listTree',
  description: 'Affiche l\'arborescence des fichiers du répertoire de manière intelligente avec filtrage automatique et comptage des lignes',
  parameters: listTreeSchema,
  execute: async (args) => {
    const { 
      path: targetPath = process.cwd(),
      maxDepth = 5,
      includeHidden = false,
      customIgnore = []
    } = args;
    
    const ignoreList = [...DEFAULT_IGNORE_FOLDERS, ...customIgnore];
    
    if (!await fs.pathExists(targetPath)) {
      throw new Error(`Le répertoire ${targetPath} n'existe pas`);
    }
    
    const items = await scanDirectory(
      targetPath,
      ignoreList,
      includeHidden,
      maxDepth
    );
    
    return formatTree(items, path.basename(targetPath));
  }
});

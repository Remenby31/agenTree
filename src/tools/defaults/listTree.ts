import { z } from 'zod';
import { tool } from '../ToolHelper';
import * as fs from 'fs-extra';
import * as path from 'path';

const listTreeSchema = z.object({
  path: z.string().optional().describe("Path of the directory to analyze (default: current directory)"),
  maxDepth: z.number().optional().default(5).describe("Maximum depth of the tree"),
  includeHidden: z.boolean().optional().default(false).describe("Include hidden files"),
  customIgnore: z.array(z.string()).optional().describe("Additional folders to ignore")
});

// Folders to ignore by default
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

// Text file extensions for line counting
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
    // If the file cannot be read as text, return 0
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
  currentDepth: number = 0,
  basePath: string = dirPath
): Promise<FileInfo[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const items: FileInfo[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      // Calculer le chemin relatif par rapport au basePath au lieu de process.cwd()
      const relativePath = path.relative(basePath, fullPath);
      
      // Ignore hidden files/folders (starting with .) unless explicitly requested
      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }
      
      // Ignore folders in the ignore list
      if (entry.isDirectory() && ignoreList.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        const subItems = await scanDirectory(
          fullPath,
          ignoreList,
          includeHidden,
          maxDepth,
          currentDepth + 1,
          basePath // Passer le basePath
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
    // Ignore errors when accessing folders
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return items;
}

function formatTree(items: FileInfo[], basePath: string): string {
  const result: string[] = [];
  
  // Build a hierarchical tree
  const tree: { [key: string]: FileInfo[] } = {};
  
  // Organize items by parent
  items.forEach(item => {
    const parentPath = path.dirname(item.path);
    const normalizedParent = parentPath === '.' ? '' : parentPath;
    
    if (!tree[normalizedParent]) {
      tree[normalizedParent] = [];
    }
    tree[normalizedParent].push(item);
  });
  
  // Sort each level
  Object.keys(tree).forEach(key => {
    tree[key].sort((a, b) => {
      // Folders before files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });
  });
  
  result.push('PROJECT_STRUCTURE:');
  result.push(basePath + '/');
  
  // Recursive function to display the tree
  function renderLevel(parentPath: string, depth: number) {
    const items = tree[parentPath] || [];
    
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const prefix = depth === 0 ? '' : '│   '.repeat(depth - 1) + (isLast ? '└── ' : '├── ');
      
      if (item.isDirectory) {
        result.push(`${prefix}${item.name}/`);
        // Recurse for subdirectories
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
  
  // Start at the root level
  renderLevel('', 0);
  
  // Add statistics
  const totalFiles = items.filter(item => !item.isDirectory).length;
  const totalDirs = items.filter(item => item.isDirectory).length;
  const totalLines = items
    .filter(item => !item.isDirectory && item.lines !== undefined)
    .reduce((sum, item) => sum + (item.lines || 0), 0);
  
  result.push('');
  result.push(`${totalDirs} director${totalDirs !== 1 ? 'ies' : 'y'}, ${totalFiles} files`);
  if (totalLines > 0) {
    result.push(`Total lines of code: ${totalLines}`);
  }
  
  // Add ignored folders
  const targetDir = path.resolve(basePath);
  const ignoredInfo = DEFAULT_IGNORE_FOLDERS.filter(folder => 
    fs.existsSync(path.join(targetDir, folder))
  );
  
  if (ignoredInfo.length > 0) {
    result.push(`[IGNORED: ${ignoredInfo.join(', ')}]`);
  }
  return result.join('\n');
}

export const listTreeTool = tool({
  name: 'listTree',
  description: 'Display a tree structure of files and directories in a given path, with details like line count for text files and size for binary files.',
  parameters: listTreeSchema,
  execute: async (args) => {
    const { 
      path: targetPath = process.cwd(),
      maxDepth = 5,
      includeHidden = false,
      customIgnore = []
    } = args;
    
    const ignoreList = [...DEFAULT_IGNORE_FOLDERS, ...customIgnore];
    
    // Résoudre le chemin absolu
    const resolvedPath = path.resolve(targetPath);
    
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`Directory ${targetPath} does not exist`);
    }
    
    const items = await scanDirectory(
      resolvedPath,
      ignoreList,
      includeHidden,
      maxDepth,
      0,
      resolvedPath // Passer le basePath
    );
    
    return formatTree(items, path.basename(resolvedPath));
  }
});
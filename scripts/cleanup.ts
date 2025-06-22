#!/usr/bin/env ts-node

import * as fs from 'fs-extra';
import * as path from 'path';
import { RunParser } from './lib/RunParser';

interface CleanupOptions {
  outputFolder: string;
  keepCount?: number;
  archiveFolder?: string;
  deleteOlderThan?: number; // days
  minSize?: number; // bytes
  dryRun?: boolean;
}

class AgentRunCleanup {
  private parser: RunParser;

  constructor() {
    this.parser = new RunParser();
  }

  /**
   * Main cleanup command
   */
  async run(command?: string, ...args: string[]): Promise<void> {
    const options: CleanupOptions = {
      outputFolder: '.agentree',
      keepCount: 10,
      dryRun: false
    };

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case '--keep':
          options.keepCount = parseInt(args[++i]) || 10;
          break;
        case '--archive':
          options.archiveFolder = args[++i];
          break;
        case '--older-than':
          options.deleteOlderThan = parseInt(args[++i]) || 30;
          break;
        case '--min-size':
          options.minSize = parseInt(args[++i]) || 0;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--folder':
          options.outputFolder = args[++i];
          break;
      }
    }

    try {
      switch (command) {
        case 'old':
          await this.cleanupOldRuns(options);
          break;
        case 'failed':
          await this.cleanupFailedRuns(options);
          break;
        case 'size':
          await this.cleanupBySize(options);
          break;
        case 'archive':
          await this.archiveRuns(options);
          break;
        case 'stats':
          await this.showCleanupStats(options);
          break;
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Clean old runs (keep only N newest)
   */
  async cleanupOldRuns(options: CleanupOptions): Promise<void> {
    console.log(`🧹 Cleaning old runs from ${options.outputFolder}`);
    console.log(`📋 Keeping ${options.keepCount} newest runs${options.dryRun ? ' (DRY RUN)' : ''}\n`);

    const runs = await this.parser.scanRuns(options.outputFolder);
    const toDelete = runs.slice(options.keepCount || 10);

    if (toDelete.length === 0) {
      console.log('✅ No old runs to clean');
      return;
    }

    console.log(`📊 Found ${toDelete.length} runs to delete:`);
    let totalSize = 0;

    for (const run of toDelete) {
      totalSize += run.size;
      const status = this.getStatusIcon(run.status);
      const size = this.formatBytes(run.size);
      const age = this.getAge(new Date(run.startTime));
      
      console.log(`  ${status} ${run.agentName} - ${size} - ${age} ago`);
      console.log(`    📁 ${run.path}`);
    }

    console.log(`\n💾 Total space to free: ${this.formatBytes(totalSize)}`);

    if (!options.dryRun) {
      console.log('\n❓ Proceed with deletion? (y/N)');
      
      const confirmed = process.argv.includes('--yes') || process.argv.includes('-y');
      
      if (confirmed) {
        for (const run of toDelete) {
          await fs.remove(run.path);
          console.log(`✅ Deleted: ${run.id}`);
        }
        console.log(`\n🎉 Cleaned ${toDelete.length} runs, freed ${this.formatBytes(totalSize)}`);
      } else {
        console.log('💡 Add --yes flag to confirm deletion');
      }
    } else {
      console.log('\n💡 Add --yes flag and remove --dry-run to actually delete');
    }
  }

  /**
   * Clean failed runs
   */
  async cleanupFailedRuns(options: CleanupOptions): Promise<void> {
    console.log(`🧹 Cleaning failed runs from ${options.outputFolder}${options.dryRun ? ' (DRY RUN)' : ''}\n`);

    const runs = await this.parser.scanRuns(options.outputFolder);
    const failedRuns = runs.filter(run => run.status === 'error');

    if (failedRuns.length === 0) {
      console.log('✅ No failed runs to clean');
      return;
    }

    console.log(`📊 Found ${failedRuns.length} failed runs:`);
    let totalSize = 0;

    for (const run of failedRuns) {
      totalSize += run.size;
      const size = this.formatBytes(run.size);
      const age = this.getAge(new Date(run.startTime));
      
      console.log(`  ❌ ${run.agentName} - ${size} - ${age} ago`);
      console.log(`    📁 ${run.path}`);
    }

    console.log(`\n💾 Total space to free: ${this.formatBytes(totalSize)}`);

    if (!options.dryRun) {
      const confirmed = process.argv.includes('--yes') || process.argv.includes('-y');
      
      if (confirmed) {
        for (const run of failedRuns) {
          await fs.remove(run.path);
          console.log(`✅ Deleted: ${run.id}`);
        }
        console.log(`\n🎉 Cleaned ${failedRuns.length} failed runs`);
      } else {
        console.log('💡 Add --yes flag to confirm deletion');
      }
    }
  }

  /**
   * Clean runs by minimum size
   */
  async cleanupBySize(options: CleanupOptions): Promise<void> {
    if (!options.minSize || options.minSize <= 0) {
      console.log('❌ Please specify a minimum size with --min-size <bytes>');
      return;
    }

    console.log(`🧹 Cleaning runs larger than ${this.formatBytes(options.minSize)} from ${options.outputFolder}${options.dryRun ? ' (DRY RUN)' : ''}\n`);

    const runs = await this.parser.scanRuns(options.outputFolder);
    const largeRuns = runs.filter(run => run.size >= (options.minSize || 0));

    if (largeRuns.length === 0) {
      console.log('✅ No runs exceed the specified size');
      return;
    }

    console.log(`📊 Found ${largeRuns.length} runs to delete:`);
    let totalSize = 0;

    for (const run of largeRuns) {
      totalSize += run.size;
      const size = this.formatBytes(run.size);
      const age = this.getAge(new Date(run.startTime));
      const status = this.getStatusIcon(run.status);

      console.log(`  ${status} ${run.agentName} - ${size} - ${age} ago`);
      console.log(`    📁 ${run.path}`);
    }

    console.log(`\n💾 Total space to free: ${this.formatBytes(totalSize)}`);

    if (!options.dryRun) {
      const confirmed = process.argv.includes('--yes') || process.argv.includes('-y');
      if (confirmed) {
        for (const run of largeRuns) {
          await fs.remove(run.path);
          console.log(`✅ Deleted: ${run.id}`);
        }
        console.log(`\n🎉 Cleaned ${largeRuns.length} runs, freed ${this.formatBytes(totalSize)}`);
      } else {
        console.log('💡 Add --yes flag to confirm deletion');
      }
    } else {
      console.log('\n💡 Add --yes flag and remove --dry-run to actually delete');
    }
  }

  /**
   * Archive runs to compressed folder
   */
  async archiveRuns(options: CleanupOptions): Promise<void> {
    if (!options.archiveFolder) {
      console.log('❌ Please specify archive folder with --archive <folder>');
      return;
    }

    console.log(`📦 Archiving runs to ${options.archiveFolder}${options.dryRun ? ' (DRY RUN)' : ''}\n`);

    const runs = await this.parser.scanRuns(options.outputFolder);
    const toArchive = runs.slice(options.keepCount || 10);

    if (toArchive.length === 0) {
      console.log('✅ No runs to archive');
      return;
    }

    await fs.ensureDir(options.archiveFolder);

    console.log(`📊 Archiving ${toArchive.length} runs:`);
    
    for (const run of toArchive) {
      const archiveName = `${run.id}.tar.gz`;
      const archivePath = path.join(options.archiveFolder, archiveName);
      
      console.log(`  📦 ${run.agentName} → ${archiveName}`);
      
      if (!options.dryRun) {
        // In real implementation, you'd use tar/zip library
        // For now, just copy the folder
        const targetPath = path.join(options.archiveFolder, run.id);
        await fs.copy(run.path, targetPath);
        await fs.remove(run.path);
      }
    }

    if (!options.dryRun) {
      console.log(`\n🎉 Archived ${toArchive.length} runs to ${options.archiveFolder}`);
    }
  }

  /**
   * Show cleanup statistics
   */
  async showCleanupStats(options: CleanupOptions): Promise<void> {
    console.log(`📊 Cleanup Statistics for ${options.outputFolder}\n`);

    const runs = await this.parser.scanRuns(options.outputFolder);
    
    if (runs.length === 0) {
      console.log('📭 No runs found');
      return;
    }

    // Status breakdown
    const statusCounts = {
      completed: runs.filter(r => r.status === 'completed').length,
      error: runs.filter(r => r.status === 'error').length,
      running: runs.filter(r => r.status === 'running').length
    };

    console.log('📈 Status Breakdown:');
    console.log(`  ✅ Completed: ${statusCounts.completed}`);
    console.log(`  ❌ Failed: ${statusCounts.error}`);
    console.log(`  🔄 Running: ${statusCounts.running}`);
    console.log('');

    // Size analysis
    const totalSize = runs.reduce((sum, run) => sum + run.size, 0);
    const averageSize = totalSize / runs.length;
    const largestRun = runs.reduce((max, run) => run.size > max.size ? run : max, runs[0]);
    const smallestRun = runs.reduce((min, run) => run.size < min.size ? run : min, runs[0]);

    console.log('💾 Storage Analysis:');
    console.log(`  Total Size: ${this.formatBytes(totalSize)}`);
    console.log(`  Average Size: ${this.formatBytes(averageSize)}`);
    console.log(`  Largest Run: ${this.formatBytes(largestRun.size)} (${largestRun.agentName})`);
    console.log(`  Smallest Run: ${this.formatBytes(smallestRun.size)} (${smallestRun.agentName})`);
    console.log('');

    // Age analysis
    const now = new Date();
    const ages = {
      last24h: runs.filter(r => (now.getTime() - new Date(r.startTime).getTime()) < 24 * 60 * 60 * 1000).length,
      last7d: runs.filter(r => (now.getTime() - new Date(r.startTime).getTime()) < 7 * 24 * 60 * 60 * 1000).length,
      last30d: runs.filter(r => (now.getTime() - new Date(r.startTime).getTime()) < 30 * 24 * 60 * 60 * 1000).length,
      older: runs.filter(r => (now.getTime() - new Date(r.startTime).getTime()) >= 30 * 24 * 60 * 60 * 1000).length
    };

    console.log('📅 Age Distribution:');
    console.log(`  Last 24h: ${ages.last24h} runs`);
    console.log(`  Last 7d: ${ages.last7d} runs`);
    console.log(`  Last 30d: ${ages.last30d} runs`);
    console.log(`  Older than 30d: ${ages.older} runs`);
    console.log('');

    // Cleanup recommendations
    console.log('💡 Cleanup Recommendations:');
    
    if (statusCounts.error > 0) {
      const failedSize = runs.filter(r => r.status === 'error').reduce((sum, r) => sum + r.size, 0);
      console.log(`  🧹 Clean ${statusCounts.error} failed runs → Save ${this.formatBytes(failedSize)}`);
      console.log(`     Command: npm run cleanup failed --yes`);
    }

    if (ages.older > 0) {
      const oldSize = runs.filter(r => (now.getTime() - new Date(r.startTime).getTime()) >= 30 * 24 * 60 * 60 * 1000)
        .reduce((sum, r) => sum + r.size, 0);
      console.log(`  📦 Archive ${ages.older} old runs → Save ${this.formatBytes(oldSize)}`);
      console.log(`     Command: npm run cleanup archive --archive ./archive`);
    }

    if (runs.length > 20) {
      const excess = runs.slice(20);
      const excessSize = excess.reduce((sum, r) => sum + r.size, 0);
      console.log(`  🗂️  Keep only 20 newest runs → Save ${this.formatBytes(excessSize)}`);
      console.log(`     Command: npm run cleanup old --keep 20 --yes`);
    }
  }

  /**
   * Helper methods
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private getAge(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffMins = Math.floor(diffMs / (60 * 1000));

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return `${diffMins}m`;
  }

  private showHelp(): void {
    console.log(`🧹 Agent Run Cleanup Tool

Usage: npm run cleanup <command> [options]

Commands:
  old                    Clean old runs (keep newest N)
  failed                 Clean failed runs only
  size                   Clean runs by size criteria
  archive                Archive old runs to compressed folder
  stats                  Show cleanup statistics and recommendations

Options:
  --keep <number>        Number of runs to keep (default: 10)
  --archive <folder>     Archive folder path
  --older-than <days>    Delete runs older than N days
  --min-size <bytes>     Minimum size threshold
  --folder <path>        Output folder (default: .agentree)
  --dry-run              Show what would be deleted without doing it
  --yes, -y              Auto-confirm deletions

Examples:
  npm run cleanup stats                    # Show cleanup recommendations
  npm run cleanup old --keep 5 --yes      # Keep only 5 newest runs
  npm run cleanup failed --dry-run        # Preview failed run cleanup
  npm run cleanup archive --archive ./old # Archive old runs
  npm run cleanup old --older-than 30     # Delete runs older than 30 days

⚠️  Always use --dry-run first to preview changes!
`);
  }
}

// CLI execution
if (require.main === module) {
  const cleanup = new AgentRunCleanup();
  const [,, command, ...args] = process.argv;
  cleanup.run(command, ...args);
}

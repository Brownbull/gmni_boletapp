/**
 * Categories Command - Show available test categories
 *
 * Displays a summary table of all test categories with:
 * - Number of images with baselines (testable)
 * - Total number of images
 * - Estimated cost to run all tests
 *
 * Use this before running tests to decide what and how many to run.
 */

import chalk from 'chalk';
import { CONFIG } from '../config';
import { discoverAllCategories } from '../lib/discovery';

interface CategoriesOptions {
  folder?: string;
}

/**
 * Execute the categories command.
 */
export async function categoriesCommand(options: CategoriesOptions): Promise<void> {
  const testDataDir = options.folder || CONFIG.testDataDir;
  const categories = discoverAllCategories(testDataDir);

  if (categories.length === 0) {
    console.log(chalk.yellow('No test categories found.'));
    console.log(chalk.dim(`Looked in: ${testDataDir}`));
    return;
  }

  const totalBaseline = categories.reduce((sum, c) => sum + c.withBaseline, 0);
  const totalImages = categories.reduce((sum, c) => sum + c.totalImages, 0);
  const estimatedCost = totalBaseline * CONFIG.estimatedCostPerScan;

  console.log(chalk.bold('\nAvailable test categories:'));
  console.log('');

  // Header
  const catCol = 22;
  const numCol = 12;
  console.log(
    '  ' +
    chalk.dim('Category'.padEnd(catCol)) +
    chalk.dim('Testable'.padStart(numCol)) +
    chalk.dim('Total images'.padStart(numCol + 2))
  );
  console.log('  ' + chalk.dim('─'.repeat(catCol + numCol * 2 + 2)));

  // Rows
  for (const cat of categories) {
    const testable = String(cat.withBaseline).padStart(numCol);
    const total = String(cat.totalImages).padStart(numCol + 2);
    const catName = cat.path.padEnd(catCol);

    if (cat.withBaseline === 0) {
      console.log('  ' + chalk.dim(catName + testable + total));
    } else {
      console.log('  ' + catName + chalk.green(testable) + total);
    }
  }

  // Footer
  console.log('  ' + chalk.dim('─'.repeat(catCol + numCol * 2 + 2)));
  console.log(
    '  ' +
    chalk.bold('Total'.padEnd(catCol)) +
    chalk.bold(String(totalBaseline).padStart(numCol)) +
    String(totalImages).padStart(numCol + 2)
  );

  console.log('');
  console.log(chalk.dim(`  Cost: ~$${CONFIG.estimatedCostPerScan} per test | Max ${CONFIG.maxTestsPerRun} per run`));
  console.log(chalk.dim(`  Run all: npm run test:scan -- run --limit all (~$${estimatedCost.toFixed(2)})`));
  console.log(chalk.dim(`  By type: npm run test:scan -- run --type=supermarket --limit=5`));
  console.log('');
}

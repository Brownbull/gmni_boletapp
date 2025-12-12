#!/usr/bin/env node
/**
 * Scan Test CLI - Entry point
 *
 * Developer testing infrastructure for evaluating receipt scan accuracy.
 *
 * Commands:
 *   npm run test:scan              - Run test suite
 *   npm run test:scan:generate     - Generate expected.json from images
 *   npm run test:scan:validate     - Validate all expected.json files
 *   npm run test:scan:analyze      - Analyze failure patterns
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md
 */

import { Command } from 'commander';
import { runCommand } from './commands/run';
import { generateCommand } from './commands/generate';
import { validateCommand } from './commands/validate';
import { analyzeCommand } from './commands/analyze';

const program = new Command();

program
  .name('scan-test')
  .description('Receipt scan testing harness for evaluating and improving scan accuracy')
  .version('1.0.0');

// Run command - Execute scan tests
program
  .command('run')
  .description('Run scan tests against Cloud Function')
  .option('--image <filename>', 'Run single test by image filename')
  .option('--type <storetype>', 'Filter by store type (supermarket, pharmacy, restaurant, gas_station, convenience, other)')
  .option('--limit <n>', 'Maximum tests to run (default: 5, use "all" for no limit)', '5')
  .option('--verbose', 'Show detailed per-test output with field comparisons')
  .option('--dry-run', 'Show what would run without making API calls')
  .option('--folder <path>', 'Custom test data folder')
  .option('--prompt <id>', 'Use specific prompt version (e.g., v1-original, v2-multi-currency-types)')
  .option('--compare <v1,v2>', 'A/B compare two prompt versions (comma-separated)')
  .action(runCommand);

// Generate command - Create expected.json from Cloud Function
program
  .command('generate')
  .description('Generate expected.json files by calling Cloud Function')
  .argument('[path]', 'Image path (e.g., other/estacionamiento or other/estacionamiento.jpg)')
  .option('--image <filename>', 'Generate for single image file (alternative to positional)')
  .option('--folder <path>', 'Generate for all images in folder')
  .option('--force', 'Overwrite existing expected.json files')
  .action((pathArg, options) => {
    // Support positional argument as image path
    if (pathArg && !options.image && !options.folder) {
      options.image = pathArg;
    }
    return generateCommand(options);
  });

// Validate command - Check expected.json files against schema
program
  .command('validate')
  .description('Validate expected.json files against schema')
  .option('--file <path>', 'Validate single file')
  .action(validateCommand);

// Analyze command - Analyze failure patterns (AC1, AC2, AC3, AC7)
program
  .command('analyze')
  .description('Analyze test results and generate failure pattern report')
  .option('--result <path>', 'Analyze specific results file (default: most recent)')
  .action(analyzeCommand);

// Default action: run the 'run' command if no subcommand specified
program.action(() => {
  // When called with no subcommand, execute 'run' with default options
  program.commands.find(cmd => cmd.name() === 'run')?.parse(process.argv);
});

// Parse arguments
program.parse();

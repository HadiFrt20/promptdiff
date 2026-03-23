const path = require('path');
const chalk = require('chalk');
const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const { computeQualityScore } = require('../scorer/quality-scorer');
const { MLflowClient } = require('../integrations/mlflow');
const { header, passSymbol, errorSymbol, divider, dim, bold, indent } = require('../formatter/terminal');

function step(msg) {
  console.log(indent(`${passSymbol()} ${msg}`));
}

function countConstraints(parsedPrompt) {
  const sections = parsedPrompt.sections || [];
  const constraintSections = sections.filter(s => s.type === 'constraints');
  let count = 0;
  for (const s of constraintSections) {
    for (const line of s.lines) {
      if (/^\s*[-*]\s/.test(line) || /^\s*\d+[.)]\s/.test(line) || /\b(must|never|always|shall|do not|don't)\b/i.test(line)) {
        count++;
      }
    }
  }
  return count;
}

function countExamples(parsedPrompt) {
  const sections = parsedPrompt.sections || [];
  const exampleSections = sections.filter(s => s.type === 'examples');
  let count = 0;
  for (const s of exampleSections) {
    for (const line of s.lines) {
      if (/^\s*[-*]\s/.test(line) || /^\s*\d+[.)]\s/.test(line) || /^(input|output|user|assistant|example|q:|a:)/i.test(line.trim())) {
        count++;
      }
    }
  }
  return count;
}

async function mlflowLogCommand(file, options = {}) {
  const experimentName = options.experiment || 'promptdiff';
  const runName = options.runName || path.basename(file, path.extname(file));
  const trackingUri = options.trackingUri || undefined;

  console.log(header('Log to MLflow'));
  console.log();

  // Step 1: Parse
  const parsed = parsePromptFile(file);
  step(`Parsed ${dim(path.basename(file))}`);

  // Step 2: Lint
  const lintResult = lint(parsed);
  step(`Linted — ${lintResult.summary.errors} errors, ${lintResult.summary.warnings} warnings`);

  // Step 3: Score
  const scoreResult = computeQualityScore(parsed, lintResult);
  step(`Scored — ${bold(String(scoreResult.total))}/${bold('100')} (grade ${scoreResult.grade})`);

  // Step 4: Connect
  const client = new MLflowClient(trackingUri);
  step(`Connecting to MLflow at ${dim(client.trackingUri)}`);

  // Step 5: Get/create experiment
  const experimentId = await client.getOrCreateExperiment(experimentName);
  step(`Experiment: ${bold(experimentName)} (${experimentId})`);

  // Step 6: Create run
  const run = await client.createRun(experimentId, {
    'mlflow.runName': runName,
    'mlflow.source.name': 'promptdiff',
  });
  const runId = run.info.run_id;
  step(`Created run ${dim(runId)}`);

  // Step 7: Log params
  const meta = parsed.meta || {};
  const params = {
    'prompt.name': meta.name || path.basename(file, path.extname(file)),
    'prompt.version': meta.version || 'unknown',
    'prompt.author': meta.author || 'unknown',
    'prompt.model': meta.model || 'unspecified',
    'prompt.section_count': String((parsed.sections || []).length),
    'prompt.constraint_count': String(countConstraints(parsed)),
    'prompt.example_count': String(countExamples(parsed)),
  };

  for (const [key, value] of Object.entries(params)) {
    await client.logParam(runId, key, value);
  }
  step(`Logged ${Object.keys(params).length} params`);

  // Step 8: Log metrics
  const wordCount = (parsed.raw || '').split(/\s+/).filter(Boolean).length;
  const metrics = {
    'quality.total': scoreResult.total,
    'quality.word_count': wordCount,
    'lint.error_count': lintResult.summary.errors,
    'lint.warning_count': lintResult.summary.warnings,
  };

  for (const dim of scoreResult.dimensions) {
    metrics[`quality.${dim.name.toLowerCase()}`] = dim.score;
  }

  for (const [key, value] of Object.entries(metrics)) {
    await client.logMetric(runId, key, value);
  }
  step(`Logged ${Object.keys(metrics).length} metrics`);

  // Step 9: Tags
  if (meta.tags && Array.isArray(meta.tags)) {
    for (const tag of meta.tags) {
      await client.setTag(runId, `prompt.tag.${tag}`, 'true');
    }
  }
  await client.setTag(runId, 'prompt.hash', parsed.hash || 'unknown');
  step('Logged tags');

  // Step 10: Artifact
  await client.logArtifact(runId, file, path.basename(file));
  step(`Uploaded artifact ${dim(path.basename(file))}`);

  // Step 11: End run
  await client.endRun(runId, 'FINISHED');
  step('Run completed');

  // Show URL
  const runUrl = client.getRunUrl(experimentId, runId);
  console.log();
  console.log(divider());
  console.log(indent(`${bold('Run URL:')} ${chalk.underline.cyan(runUrl)}`));
  console.log(divider());
  console.log();

  return { experimentId, runId, runUrl };
}

module.exports = { mlflowLogCommand };

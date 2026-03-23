const path = require('path');
const fs = require('fs');
const os = require('os');
const chalk = require('chalk');
const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const { computeQualityScore } = require('../scorer/quality-scorer');
const { semanticDiff } = require('../differ/semantic-diff');
const { MLflowClient } = require('../integrations/mlflow');
const { header, passSymbol, divider, dim, bold, indent } = require('../formatter/terminal');

function step(msg) {
  console.log(indent(`${passSymbol()} ${msg}`));
}

async function mlflowDiffCommand(fileA, fileB, options = {}) {
  const experimentName = options.experiment || 'promptdiff';
  const trackingUri = options.trackingUri || undefined;

  console.log(header('Diff to MLflow'));
  console.log();

  // Step 1: Parse both files
  const left = parsePromptFile(fileA);
  const right = parsePromptFile(fileB);
  step(`Parsed ${dim(path.basename(fileA))} and ${dim(path.basename(fileB))}`);

  // Step 2: Lint both
  const leftLint = lint(left);
  const rightLint = lint(right);
  step('Linted both files');

  // Step 3: Score both
  const leftScore = computeQualityScore(left, leftLint);
  const rightScore = computeQualityScore(right, rightLint);
  step(`Scores: ${bold(String(leftScore.total))} vs ${bold(String(rightScore.total))}`);

  // Step 4: Diff
  const diffResult = semanticDiff(left, right, { annotate: true });
  step(`Diff: +${diffResult.summary.added} -${diffResult.summary.removed} ~${diffResult.summary.modified}`);

  // Step 5: Connect
  const client = new MLflowClient(trackingUri);
  step(`Connecting to MLflow at ${dim(client.trackingUri)}`);

  // Step 6: Get/create experiment
  const experimentId = await client.getOrCreateExperiment(experimentName);
  step(`Experiment: ${bold(experimentName)} (${experimentId})`);

  // Step 7: Create run
  const runName = `diff: ${path.basename(fileA)} vs ${path.basename(fileB)}`;
  const run = await client.createRun(experimentId, {
    'mlflow.runName': runName,
    'mlflow.source.name': 'promptdiff-diff',
  });
  const runId = run.info.run_id;
  step(`Created run ${dim(runId)}`);

  // Step 8: Log params
  const leftMeta = left.meta || {};
  const rightMeta = right.meta || {};
  const params = {
    'left_version': leftMeta.version || 'unknown',
    'right_version': rightMeta.version || 'unknown',
    'left_file': path.basename(fileA),
    'right_file': path.basename(fileB),
  };

  for (const [key, value] of Object.entries(params)) {
    await client.logParam(runId, key, value);
  }
  step(`Logged ${Object.keys(params).length} params`);

  // Step 9: Log metrics
  const metrics = {
    'changes_added': diffResult.summary.added,
    'changes_removed': diffResult.summary.removed,
    'changes_modified': diffResult.summary.modified,
    'left_score': leftScore.total,
    'right_score': rightScore.total,
    'score_delta': rightScore.total - leftScore.total,
  };

  for (const [key, value] of Object.entries(metrics)) {
    await client.logMetric(runId, key, value);
  }
  step(`Logged ${Object.keys(metrics).length} metrics`);

  // Step 10: Tags
  if (diffResult.summary.sections_affected && diffResult.summary.sections_affected.length > 0) {
    await client.setTag(runId, 'sections_affected', diffResult.summary.sections_affected.join(', '));
  }
  step('Logged tags');

  // Step 11: Artifacts
  await client.logArtifact(runId, fileA, path.basename(fileA));
  await client.logArtifact(runId, fileB, path.basename(fileB));

  // Write diff JSON to temp file and upload
  const diffJsonPath = path.join(os.tmpdir(), `promptdiff-diff-${runId}.json`);
  fs.writeFileSync(diffJsonPath, JSON.stringify(diffResult, null, 2));
  await client.logArtifact(runId, diffJsonPath, 'diff-result.json');

  // Clean up temp file
  try { fs.unlinkSync(diffJsonPath); } catch (e) { /* ignore */ }

  step('Uploaded artifacts');

  // Step 12: End run
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

module.exports = { mlflowDiffCommand };

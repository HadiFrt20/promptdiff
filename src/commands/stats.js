const { parsePromptFile } = require('../parser/prompt-file');
const { lint } = require('../linter/engine');
const { computeQualityScore } = require('../scorer/quality-scorer');
const { renderStats } = require('../formatter/stats-renderer');

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countConstraints(parsedPrompt) {
  const constraintSections = (parsedPrompt.sections || []).filter(s => s.type === 'constraints');
  let count = 0;
  for (const section of constraintSections) {
    count += section.lines.filter(l =>
      /^\s*[-*]\s/.test(l) ||
      /^\s*\d+[.)]\s/.test(l) ||
      /^(never|always|do not|don't|must|shall|required|forbidden)/i.test(l.trim())
    ).length;
  }
  // If there are constraint lines but none matched the patterns, count all non-empty lines
  if (count === 0 && constraintSections.length > 0) {
    for (const section of constraintSections) {
      count += section.lines.filter(l => l.trim().length > 0).length;
    }
  }
  return count;
}

function countExamples(parsedPrompt) {
  const exampleSections = (parsedPrompt.sections || []).filter(s => s.type === 'examples');
  let count = 0;
  for (const section of exampleSections) {
    count += section.lines.filter(l =>
      /^\s*[-*]\s/.test(l) ||
      /^\s*\d+[.)]\s/.test(l) ||
      /^(input|output|user|assistant|example|q:|a:)/i.test(l.trim())
    ).length;
  }
  if (count === 0 && exampleSections.length > 0) {
    count = exampleSections.length;
  }
  return count;
}

function statsCommand(file, options = {}) {
  const parsed = parsePromptFile(file);
  const lintResult = lint(parsed);
  const qualityScore = computeQualityScore(parsed, lintResult);

  const rawLines = parsed.raw.split('\n');
  const wordCount = countWords(parsed.raw);

  const sections = (parsed.sections || []).map(s => {
    const sectionLines = s.lines || s.raw.split('\n');
    return {
      name: s.label || s.type,
      lineCount: sectionLines.length,
      wordCount: countWords(sectionLines.join('\n')),
    };
  });

  const statsResult = {
    filePath: parsed.filePath,
    version: parsed.meta?.version || null,
    lineCount: rawLines.length,
    wordCount,
    sectionCount: (parsed.sections || []).length,
    constraintCount: countConstraints(parsed),
    exampleCount: countExamples(parsed),
    sections,
    qualityScore: qualityScore.total,
    grade: qualityScore.grade,
  };

  const { output } = require('../formatter/output');
  output(statsResult, { json: options.json, render: renderStats });
  return statsResult;
}

module.exports = { statsCommand };

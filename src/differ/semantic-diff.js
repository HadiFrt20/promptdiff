const { diffSectionLines } = require('./section-differ');
const { classifyChange, classifyExampleCountChange } = require('./change-classifier');
const { annotateChange } = require('./annotation-engine');

function semanticDiff(left, right, options = {}) {
  const changes = [];
  const sectionsAffected = new Set();

  // Match sections by type
  const leftByType = {};
  const rightByType = {};

  for (const s of left.sections) {
    const key = s.type + ':' + s.label;
    leftByType[key] = s;
  }
  for (const s of right.sections) {
    const key = s.type + ':' + s.label;
    rightByType[key] = s;
  }

  // Also match by type alone if label-match fails
  const leftByTypeOnly = {};
  const rightByTypeOnly = {};
  for (const s of left.sections) {
    if (!leftByTypeOnly[s.type]) leftByTypeOnly[s.type] = [];
    leftByTypeOnly[s.type].push(s);
  }
  for (const s of right.sections) {
    if (!rightByTypeOnly[s.type]) rightByTypeOnly[s.type] = [];
    rightByTypeOnly[s.type].push(s);
  }

  const processedRight = new Set();

  // Process each left section
  for (const leftSection of left.sections) {
    const key = leftSection.type + ':' + leftSection.label;
    let rightSection = rightByType[key];

    // Fallback: match by type alone
    if (!rightSection) {
      const candidates = rightByTypeOnly[leftSection.type] || [];
      rightSection = candidates.find(c => !processedRight.has(c.type + ':' + c.label));
    }

    if (rightSection) {
      processedRight.add(rightSection.type + ':' + rightSection.label);
      const lineChanges = diffSectionLines(leftSection.lines, rightSection.lines);

      let hasChanges = false;
      const contextN = options.context || 0;

      if (contextN > 0) {
        // Build list with context lines included
        const sectionChanges = [];
        for (const lc of lineChanges) {
          if (lc.status === 'unchanged') {
            sectionChanges.push({
              _isContext: true,
              type: 'context',
              section: leftSection.label,
              text: lc.left_line,
            });
          } else {
            hasChanges = true;
            const classification = classifyChange(
              lc.left_line || null,
              lc.right_line || null,
              leftSection.type
            );
            const change = {
              type: classification.type,
              section: leftSection.label,
              impact: classification.impact,
              left_line: lc.left_line || undefined,
              right_line: lc.right_line || undefined,
              detail: '',
            };
            if (options.annotate) {
              const annotated = annotateChange(change);
              change.description = annotated.description;
              if (annotated.behavioralNote) change.behavioralNote = annotated.behavioralNote;
            }
            sectionChanges.push(change);
          }
        }

        if (hasChanges) {
          // Filter context lines: only keep those within contextN lines of a real change
          const isReal = sectionChanges.map(c => !c._isContext);
          for (let i = 0; i < sectionChanges.length; i++) {
            if (!sectionChanges[i]._isContext) {
              changes.push(sectionChanges[i]);
              continue;
            }
            // Check if within contextN of a real change
            let nearChange = false;
            for (let d = 1; d <= contextN; d++) {
              if ((i - d >= 0 && isReal[i - d]) || (i + d < sectionChanges.length && isReal[i + d])) {
                nearChange = true;
                break;
              }
            }
            if (nearChange) {
              const ctx = { type: 'context', section: sectionChanges[i].section, text: sectionChanges[i].text };
              changes.push(ctx);
            } else {
              // Mark as a collapse gap (will be merged by renderer)
              const prev = changes[changes.length - 1];
              if (!prev || prev.type !== 'collapse') {
                changes.push({ type: 'collapse', section: sectionChanges[i].section });
              }
            }
          }
        }
      } else {
        for (const lc of lineChanges) {
          if (lc.status === 'unchanged') continue;
          hasChanges = true;

          const classification = classifyChange(
            lc.left_line || null,
            lc.right_line || null,
            leftSection.type
          );

          const change = {
            type: classification.type,
            section: leftSection.label,
            impact: classification.impact,
            left_line: lc.left_line || undefined,
            right_line: lc.right_line || undefined,
            detail: '',
          };

          if (options.annotate) {
            const annotated = annotateChange(change);
            change.description = annotated.description;
            if (annotated.behavioralNote) change.behavioralNote = annotated.behavioralNote;
          }

          changes.push(change);
        }
      }

      // Check example count changes
      if (leftSection.type === 'examples' && rightSection.type === 'examples') {
        const leftCount = leftSection.lines.length;
        const rightCount = rightSection.lines.length;
        if (leftCount !== rightCount) {
          const exChange = classifyExampleCountChange(leftCount, rightCount);
          if (exChange && leftCount > rightCount) {
            // Already captured via line diffs
          }
        }
      }

      if (hasChanges) sectionsAffected.add(leftSection.label);
    } else {
      // Section removed
      sectionsAffected.add(leftSection.label);
      for (const line of leftSection.lines) {
        const change = {
          type: 'removed',
          section: leftSection.label,
          impact: 'high',
          left_line: line,
          detail: `Section ${leftSection.label} removed`,
        };
        if (options.annotate) {
          change.description = `Removed: "${line}"`;
          const annotated = annotateChange(change);
          if (annotated.behavioralNote) change.behavioralNote = annotated.behavioralNote;
        }
        changes.push(change);
      }
    }
  }

  // Check for new sections in right
  for (const rightSection of right.sections) {
    const key = rightSection.type + ':' + rightSection.label;
    if (!processedRight.has(key)) {
      sectionsAffected.add(rightSection.label);
      for (const line of rightSection.lines) {
        const change = {
          type: 'added',
          section: rightSection.label,
          impact: 'high',
          right_line: line,
          detail: `Section ${rightSection.label} added`,
        };
        if (options.annotate) {
          change.description = `Added: "${line}"`;
          const annotated = annotateChange(change);
          if (annotated.behavioralNote) change.behavioralNote = annotated.behavioralNote;
        }
        changes.push(change);
      }
    }
  }

  const summary = {
    added: changes.filter(c => c.type === 'added').length,
    removed: changes.filter(c => c.type === 'removed').length,
    modified: changes.filter(c => !['added', 'removed', 'context', 'collapse'].includes(c.type)).length,
    sections_affected: [...sectionsAffected],
  };

  return {
    left: { meta: left.meta, filePath: left.filePath },
    right: { meta: right.meta, filePath: right.filePath },
    summary,
    changes,
  };
}

module.exports = { semanticDiff };

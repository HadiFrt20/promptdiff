const { tokenOverlap } = require('./change-classifier');

function diffSectionLines(leftLines, rightLines) {
  const changes = [];
  const matched = new Set();

  for (let i = 0; i < leftLines.length; i++) {
    const leftLine = leftLines[i];
    let bestMatch = -1;
    let bestOverlap = 0;

    for (let j = 0; j < rightLines.length; j++) {
      if (matched.has(j)) continue;
      if (leftLine === rightLines[j]) {
        bestMatch = j;
        bestOverlap = 1.0;
        break;
      }
      const overlap = tokenOverlap(leftLine, rightLines[j]);
      if (overlap > bestOverlap && overlap >= 0.4) {
        bestOverlap = overlap;
        bestMatch = j;
      }
    }

    if (bestMatch >= 0) {
      matched.add(bestMatch);
      if (leftLine !== rightLines[bestMatch]) {
        changes.push({
          status: 'modified',
          left_line: leftLine,
          right_line: rightLines[bestMatch],
          left_index: i,
          right_index: bestMatch,
        });
      } else {
        changes.push({
          status: 'unchanged',
          left_line: leftLine,
          right_line: rightLines[bestMatch],
          left_index: i,
          right_index: bestMatch,
        });
      }
    } else {
      changes.push({
        status: 'removed',
        left_line: leftLine,
        left_index: i,
      });
    }
  }

  for (let j = 0; j < rightLines.length; j++) {
    if (!matched.has(j)) {
      changes.push({
        status: 'added',
        right_line: rightLines[j],
        right_index: j,
      });
    }
  }

  return changes;
}

module.exports = { diffSectionLines };

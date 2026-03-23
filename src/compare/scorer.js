function scoreOutput(output, parsedPrompt) {
  if (!output || output.trim().length === 0) {
    return { score: 0, flags: [{ type: 'violation', rule: 'empty-output', detail: 'Output is empty' }], word_count: 0 };
  }

  const constraints = extractConstraints(parsedPrompt);
  const flags = [];
  let passed = 0;
  const total = constraints.length;

  const wordCount = output.split(/\s+/).filter(w => w.length > 0).length;

  for (const constraint of constraints) {
    const result = checkConstraint(constraint, output, wordCount);
    flags.push(result);
    if (result.type === 'pass') passed++;
  }

  const score = total > 0 ? Math.round((passed / total) * 100) : 100;

  return { score, flags, word_count: wordCount };
}

function extractConstraints(parsedPrompt) {
  const constraints = [];

  const constraintSection = parsedPrompt.sections.find(s => s.type === 'constraints');
  const formatSection = parsedPrompt.sections.find(s => s.type === 'format');

  if (constraintSection) {
    for (const line of constraintSection.lines) {
      // Word limit
      const wordMatch = line.match(/(\d+)\s*words?/i);
      if (wordMatch) {
        constraints.push({ type: 'word-limit', value: parseInt(wordMatch[1]), line });
        continue;
      }

      // Forbidden topics
      const forbiddenMatch = line.match(/(?:do not|don't|never)\s+(?:discuss|mention|talk about|bring up)\s+(.+?)(?:\.|$)/i);
      if (forbiddenMatch) {
        const topics = forbiddenMatch[1].split(/,\s*|\s+or\s+/).map(t => t.trim().toLowerCase());
        constraints.push({ type: 'forbidden-topic', topics, line });
        continue;
      }

      // Redirect rules
      const redirectMatch = line.match(/redirect to (.+?)(?:\.|$)/i);
      if (redirectMatch) {
        constraints.push({ type: 'redirect', target: redirectMatch[1].trim().toLowerCase(), line });
        continue;
      }

      // Generic constraint
      constraints.push({ type: 'generic', line });
    }
  }

  if (formatSection) {
    for (const line of formatSection.lines) {
      // Sign-off requirements
      if (/sign off/i.test(line)) {
        const requiresTicket = /ticket/i.test(line);
        const requiresName = /name/i.test(line);
        constraints.push({ type: 'sign-off', requiresTicket, requiresName, line });
      }

      // No markdown
      if (/no markdown/i.test(line)) {
        constraints.push({ type: 'no-markdown', line });
      }

      // No bullet points
      if (/no bullet/i.test(line)) {
        constraints.push({ type: 'no-bullets', line });
      }
    }
  }

  return constraints;
}

function checkConstraint(constraint, output, wordCount) {
  switch (constraint.type) {
    case 'word-limit':
      if (wordCount <= constraint.value) {
        return { type: 'pass', rule: 'word-limit', detail: `${wordCount} words, within ${constraint.value} word limit` };
      }
      return { type: 'violation', rule: 'word-limit', detail: `${wordCount} words, over ${constraint.value} word limit` };

    case 'forbidden-topic': {
      const outputLower = output.toLowerCase();
      const mentioned = constraint.topics.filter(t => outputLower.includes(t));
      if (mentioned.length === 0) {
        return { type: 'pass', rule: 'forbidden-topic', detail: `Avoided forbidden topics` };
      }
      return { type: 'violation', rule: 'forbidden-topic', detail: `Mentions forbidden topic: ${mentioned.join(', ')}` };
    }

    case 'redirect': {
      const outputLower = output.toLowerCase();
      if (outputLower.includes(constraint.target) || outputLower.includes('redirect') || outputLower.includes('connect you with')) {
        return { type: 'pass', rule: 'billing-redirect', detail: `Correctly redirects to ${constraint.target}` };
      }
      return { type: 'violation', rule: 'billing-redirect', detail: `Does not redirect to ${constraint.target}` };
    }

    case 'sign-off': {
      const hasTicket = /\(?\#?[A-Z]{0,4}-?\d{3,}\)?/.test(output);
      if (constraint.requiresTicket && !hasTicket) {
        return { type: 'violation', rule: 'ticket-number', detail: 'Missing ticket number in sign-off' };
      }
      return { type: 'pass', rule: 'ticket-number', detail: 'Includes ticket number in sign-off' };
    }

    case 'no-markdown': {
      const hasMarkdown = /[*_#`\[\]]/.test(output);
      if (hasMarkdown) {
        return { type: 'violation', rule: 'no-markdown', detail: 'Output contains markdown formatting' };
      }
      return { type: 'pass', rule: 'no-markdown', detail: 'No markdown detected' };
    }

    case 'no-bullets': {
      const hasBullets = /^[\s]*[-*•]\s/m.test(output);
      if (hasBullets) {
        return { type: 'violation', rule: 'no-bullets', detail: 'Output contains bullet points' };
      }
      return { type: 'pass', rule: 'no-bullets', detail: 'No bullet points detected' };
    }

    default:
      return { type: 'pass', rule: 'generic', detail: 'Cannot verify automatically' };
  }
}

module.exports = { scoreOutput, extractConstraints, checkConstraint };

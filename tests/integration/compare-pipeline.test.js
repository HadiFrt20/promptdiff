const path = require('path');
const { parsePromptFile } = require('../../src/parser/prompt-file');
const { runComparison } = require('../../src/compare/runner');

const FIXTURES = path.join(__dirname, '../fixtures/prompts');

describe('compare pipeline integration', () => {
  const v3Path = path.join(FIXTURES, 'support-agent-v3.prompt');
  const v7Path = path.join(FIXTURES, 'support-agent-v7.prompt');

  function createMockProvider(responses) {
    let callCount = 0;
    return {
      model: 'mock-model',
      generate: async (prompt, input) => {
        const text = responses[callCount] || 'Default mock response.';
        callCount++;
        return { text, time_ms: 100 };
      },
    };
  }

  test('compare with mock: result has all fields', async () => {
    const left = parsePromptFile(v3Path);
    const right = parsePromptFile(v7Path);
    const provider = createMockProvider([
      'I can help you with that issue right away. Let me check your account.',
      'I see the problem. I have resolved it for you. Have a great day!',
    ]);
    const result = await runComparison(left, right, 'My export is broken', provider);
    expect(result).toHaveProperty('input');
    expect(result).toHaveProperty('model', 'mock-model');
    expect(result).toHaveProperty('left');
    expect(result).toHaveProperty('right');
    expect(result).toHaveProperty('winner');
    expect(result).toHaveProperty('verdict');
  });

  test('scores reflect constraints: output following constraints scores higher', async () => {
    const left = parsePromptFile(v7Path);
    const right = parsePromptFile(v7Path);
    // Left output violates word limit (v7 is 100 words), right stays under
    const longOutput = Array(150).fill('word').join(' ');
    const shortOutput = 'I have resolved your issue. Regards Sarah #CS-123';
    const provider = createMockProvider([longOutput, shortOutput]);
    const result = await runComparison(left, right, 'Help me', provider);
    expect(result.right.score).toBeGreaterThanOrEqual(result.left.score);
  });

  test('compare produces valid result: all required fields present', async () => {
    const left = parsePromptFile(v3Path);
    const right = parsePromptFile(v7Path);
    const provider = createMockProvider([
      'Response A here.',
      'Response B here.',
    ]);
    const result = await runComparison(left, right, 'Test input', provider);
    expect(result.left).toHaveProperty('prompt_version');
    expect(result.left).toHaveProperty('output');
    expect(result.left).toHaveProperty('score');
    expect(result.left).toHaveProperty('flags');
    expect(result.left).toHaveProperty('word_count');
    expect(result.left).toHaveProperty('generation_time_ms');
    expect(result.right).toHaveProperty('prompt_version');
    expect(result.right).toHaveProperty('output');
    expect(result.right).toHaveProperty('score');
    expect(result.right).toHaveProperty('flags');
    expect(result.right).toHaveProperty('word_count');
    expect(result.right).toHaveProperty('generation_time_ms');
  });
});

const fs = require('fs');
const chalk = require('chalk');
const { parsePromptFile } = require('../parser/prompt-file');
const { runComparison } = require('../compare/runner');
const { renderCompare } = require('../formatter/compare-renderer');
const { output } = require('../formatter/output');
const { AnthropicProvider } = require('../models/anthropic');
const { OpenAIProvider } = require('../models/openai');
const { OllamaProvider } = require('../models/ollama');
const { getApiKey } = require('../utils/config');

function resolveProvider(options = {}) {
  const model = options.model;

  // Explicit --model flag takes priority
  if (model === 'claude') {
    const key = getApiKey('anthropic');
    if (!key) {
      throw new Error(
        'Anthropic API key not found. Set the ANTHROPIC_API_KEY environment variable.\n' +
        '  export ANTHROPIC_API_KEY=sk-ant-...'
      );
    }
    return new AnthropicProvider(key);
  }

  if (model === 'gpt4o') {
    const key = getApiKey('openai');
    if (!key) {
      throw new Error(
        'OpenAI API key not found. Set the OPENAI_API_KEY environment variable.\n' +
        '  export OPENAI_API_KEY=sk-...'
      );
    }
    return new OpenAIProvider(key);
  }

  if (model === 'ollama' || model === 'llama3') {
    return new OllamaProvider(model === 'ollama' ? 'llama3' : model);
  }

  // Auto-detect from available API keys
  const anthropicKey = getApiKey('anthropic');
  if (anthropicKey) {
    return new AnthropicProvider(anthropicKey);
  }

  const openaiKey = getApiKey('openai');
  if (openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  // Fall back to Ollama (local, no key needed) only if explicitly configured or as last resort
  // But since Ollama might not be running, show a helpful error instead
  throw new Error(
    'No model provider configured. Set one of the following environment variables:\n' +
    '  ANTHROPIC_API_KEY  - for Claude models\n' +
    '  OPENAI_API_KEY     - for GPT-4o models\n' +
    'Or use --model ollama to use a local Ollama instance.'
  );
}

async function compareCommand(fileA, fileB, options = {}) {
  const left = parsePromptFile(fileA);
  const right = parsePromptFile(fileB);

  let input = options.input || '';
  if (input.startsWith('@')) {
    input = fs.readFileSync(input.slice(1), 'utf-8').trim();
  }

  const provider = resolveProvider(options);

  let result;
  try {
    result = await runComparison(left, right, input, provider);
  } catch (err) {
    // Clean up API errors
    if (err.message.includes('Failed to parse')) {
      throw new Error(`API call failed (${provider.model}): ${err.message}`);
    }
    if (err.code === 'ECONNREFUSED') {
      throw new Error(
        `Could not connect to model provider. Is the service running?\n` +
        `  Model: ${provider.model}`
      );
    }
    throw err;
  }

  output(result, {
    json: options.json,
    render: renderCompare,
  });

  return result;
}

module.exports = { compareCommand, resolveProvider };

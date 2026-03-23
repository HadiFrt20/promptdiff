const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.promptdiff');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  providers: {
    anthropic: { api_key_env: 'ANTHROPIC_API_KEY' },
    openai: { api_key_env: 'OPENAI_API_KEY' },
    ollama: { base_url: 'http://localhost:11434' },
  },
  defaults: {
    model: 'claude-sonnet-4-20250514',
  },
  lint: {
    severity_threshold: 'warn',
    disabled_rules: [],
  },
};

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiKey(provider) {
  const config = loadConfig();
  const providerConfig = config.providers?.[provider];
  if (!providerConfig?.api_key_env) return null;
  return process.env[providerConfig.api_key_env] || null;
}

function getDisabledRules() {
  const config = loadConfig();
  return config.lint?.disabled_rules || [];
}

module.exports = { loadConfig, saveConfig, getApiKey, getDisabledRules, CONFIG_DIR, CONFIG_FILE, DEFAULT_CONFIG };

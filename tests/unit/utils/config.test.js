const fs = require('fs');
const os = require('os');
const path = require('path');

describe('config', () => {
  let originalConfigDir, originalConfigFile;
  let tmpDir;
  let configModule;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptdiff-config-test-'));
    // We need to manipulate the module internals to use temp dir.
    // Clear the require cache so we get a fresh module each time.
    jest.resetModules();

    // Mock os.homedir so CONFIG_DIR points to our temp dir
    jest.spyOn(os, 'homedir').mockReturnValue(tmpDir);

    configModule = require('../../../src/utils/config');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('default config: loadConfig returns object with providers, defaults, lint fields', () => {
    const config = configModule.loadConfig();
    expect(config).toHaveProperty('providers');
    expect(config).toHaveProperty('defaults');
    expect(config).toHaveProperty('lint');
    expect(config.providers).toHaveProperty('anthropic');
    expect(config.providers).toHaveProperty('openai');
    expect(config.providers).toHaveProperty('ollama');
  });

  test('API key from env: getApiKey returns value when env var is set', () => {
    const config = configModule.loadConfig();
    // Set an env var that matches the anthropic config
    const envVar = config.providers.anthropic.api_key_env;
    process.env[envVar] = 'test-key-12345';
    const key = configModule.getApiKey('anthropic');
    expect(key).toBe('test-key-12345');
    delete process.env[envVar];
  });

  test('missing API key: getApiKey for nonexistent provider returns null', () => {
    const key = configModule.getApiKey('nonexistent');
    expect(key).toBeNull();
  });

  test('disabled rules: getDisabledRules returns array', () => {
    const rules = configModule.getDisabledRules();
    expect(Array.isArray(rules)).toBe(true);
  });
});

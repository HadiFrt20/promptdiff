const fs = require('fs');
const os = require('os');
const path = require('path');
const { initProject, trackFile, getLog, loadHistory } = require('../../../src/utils/version-tracker');

describe('version-tracker', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptdiff-vt-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('init creates directory with history.json', () => {
    const pdDir = initProject(tmpDir);
    expect(fs.existsSync(pdDir)).toBe(true);
    expect(fs.existsSync(path.join(pdDir, 'history.json'))).toBe(true);
  });

  test('track new file: trackFile creates entry in history', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'test.prompt');
    fs.writeFileSync(filePath, 'You are a helpful assistant.');
    const result = trackFile(tmpDir, filePath);
    expect(result.tracked).toBe(true);
    expect(result.version).toBe(1);
    const history = loadHistory(tmpDir);
    expect(history.files['test.prompt']).toBeDefined();
  });

  test('track new version: modify file then trackFile again yields 2 versions', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'test.prompt');
    fs.writeFileSync(filePath, 'Version 1 content');
    trackFile(tmpDir, filePath);
    fs.writeFileSync(filePath, 'Version 2 content with changes');
    const result = trackFile(tmpDir, filePath);
    expect(result.tracked).toBe(true);
    expect(result.version).toBe(2);
    const history = loadHistory(tmpDir);
    expect(history.files['test.prompt'].versions).toHaveLength(2);
  });

  test('same content no new version: trackFile same file twice yields 1 version', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'test.prompt');
    fs.writeFileSync(filePath, 'Identical content');
    trackFile(tmpDir, filePath);
    const result = trackFile(tmpDir, filePath);
    expect(result.tracked).toBe(false);
    expect(result.reason).toBe('no-change');
    const history = loadHistory(tmpDir);
    expect(history.files['test.prompt'].versions).toHaveLength(1);
  });

  test('version numbering: versions auto-increment 1, 2, 3', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'test.prompt');
    fs.writeFileSync(filePath, 'content v1');
    trackFile(tmpDir, filePath);
    fs.writeFileSync(filePath, 'content v2');
    trackFile(tmpDir, filePath);
    fs.writeFileSync(filePath, 'content v3');
    trackFile(tmpDir, filePath);
    const history = loadHistory(tmpDir);
    const versions = history.files['test.prompt'].versions.map(v => v.version);
    expect(versions).toEqual([1, 2, 3]);
  });

  test('log retrieval: getLog returns versions array for tracked file', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'test.prompt');
    fs.writeFileSync(filePath, 'some content');
    trackFile(tmpDir, filePath);
    const log = getLog(tmpDir, 'test.prompt');
    expect(Array.isArray(log)).toBe(true);
    expect(log).toHaveLength(1);
    expect(log[0]).toHaveProperty('version', 1);
    expect(log[0]).toHaveProperty('hash');
    expect(log[0]).toHaveProperty('timestamp');
  });

  test('file not tracked: getLog returns empty array', () => {
    initProject(tmpDir);
    const log = getLog(tmpDir, 'nonexistent.prompt');
    expect(log).toEqual([]);
  });
});

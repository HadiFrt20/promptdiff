const fs = require('fs');
const os = require('os');
const path = require('path');
const { initProject, trackFile, getLog, loadHistory } = require('../../src/utils/version-tracker');

describe('version tracking integration', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptdiff-vt-integ-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('init + track + modify: full cycle produces 2 versions', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'agent.prompt');
    fs.writeFileSync(filePath, 'You are a helpful assistant.');
    trackFile(tmpDir, filePath);
    fs.writeFileSync(filePath, 'You are a senior support agent.');
    trackFile(tmpDir, filePath);
    const history = loadHistory(tmpDir);
    expect(history.files['agent.prompt'].versions).toHaveLength(2);
  });

  test('log shows all: after 3 saves with different content, 3 entries', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'multi.prompt');
    fs.writeFileSync(filePath, 'Content version 1');
    trackFile(tmpDir, filePath);
    fs.writeFileSync(filePath, 'Content version 2');
    trackFile(tmpDir, filePath);
    fs.writeFileSync(filePath, 'Content version 3');
    trackFile(tmpDir, filePath);
    const log = getLog(tmpDir, 'multi.prompt');
    expect(log).toHaveLength(3);
  });

  test('hash dedup: same content twice equals 1 version', () => {
    initProject(tmpDir);
    const filePath = path.join(tmpDir, 'dedup.prompt');
    fs.writeFileSync(filePath, 'Identical content for dedup test');
    trackFile(tmpDir, filePath);
    trackFile(tmpDir, filePath);
    const log = getLog(tmpDir, 'dedup.prompt');
    expect(log).toHaveLength(1);
  });
});

const fs = require('fs');
const path = require('path');
const { computeHash } = require('./hash');

const PROMPTDIFF_DIR = '.promptdiff';
const HISTORY_FILE = 'history.json';

function initProject(dir) {
  const pdDir = path.join(dir, PROMPTDIFF_DIR);
  if (!fs.existsSync(pdDir)) {
    fs.mkdirSync(pdDir, { recursive: true });
  }

  const historyPath = path.join(pdDir, HISTORY_FILE);
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify({ files: {} }, null, 2));
  }

  return pdDir;
}

function loadHistory(dir) {
  const historyPath = path.join(dir, PROMPTDIFF_DIR, HISTORY_FILE);
  if (!fs.existsSync(historyPath)) {
    throw new Error(`No .promptdiff directory found. Run 'promptdiff init' first.`);
  }

  try {
    const raw = fs.readFileSync(historyPath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Corrupted history file: ${e.message}`);
  }
}

function saveHistory(dir, history) {
  const historyPath = path.join(dir, PROMPTDIFF_DIR, HISTORY_FILE);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function trackFile(dir, filePath) {
  const history = loadHistory(dir);
  const content = fs.readFileSync(filePath, 'utf-8');
  const hash = computeHash(content);
  const fileName = path.basename(filePath);

  if (!history.files[fileName]) {
    history.files[fileName] = { versions: [], current: 0 };
  }

  const entry = history.files[fileName];

  // Check if this hash already exists
  const existing = entry.versions.find(v => v.hash === hash);
  if (existing) {
    return { tracked: false, reason: 'no-change', version: existing.version };
  }

  const newVersion = entry.versions.length > 0
    ? entry.versions[entry.versions.length - 1].version + 1
    : 1;

  entry.versions.push({
    version: newVersion,
    hash,
    timestamp: new Date().toISOString(),
  });
  entry.current = newVersion;

  saveHistory(dir, history);
  return { tracked: true, version: newVersion };
}

function getLog(dir, fileName) {
  const history = loadHistory(dir);
  const entry = history.files[fileName];
  if (!entry) {
    return [];
  }
  return entry.versions;
}

module.exports = { initProject, loadHistory, saveHistory, trackFile, getLog, PROMPTDIFF_DIR };

const path = require('path');
const { getLog } = require('../utils/version-tracker');
const { output } = require('../formatter/output');

function renderLog(data) {
  const { fileName, versions } = data;
  if (versions.length === 0) {
    return `No version history for ${fileName}`;
  }

  const lines = [`Version history for ${fileName}:`];
  for (const v of versions) {
    lines.push(`  v${v.version}  ${v.timestamp}  ${v.hash.slice(0, 16)}...`);
  }
  return lines.join('\n');
}

function logCommand(file, dir, options = {}) {
  dir = dir || process.cwd();
  const fileName = path.basename(file);
  const versions = getLog(dir, fileName);

  const data = { fileName, versions };
  output(data, { json: options.json, render: renderLog });

  return versions;
}

module.exports = { logCommand };

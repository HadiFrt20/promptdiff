const { initProject } = require('../utils/version-tracker');

function initCommand(dir) {
  dir = dir || process.cwd();
  const pdDir = initProject(dir);
  console.log(`Initialized .promptdiff/ in ${dir}`);
  return pdDir;
}

module.exports = { initCommand };

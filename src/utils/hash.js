const crypto = require('crypto');

function computeHash(content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

module.exports = { computeHash };

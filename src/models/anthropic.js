const { BaseProvider } = require('./provider');
const https = require('https');

class AnthropicProvider extends BaseProvider {
  constructor(apiKey, model = 'claude-sonnet-4-20250514') {
    super(model);
    this.apiKey = apiKey;
  }

  async generate(systemPrompt, userInput) {
    const start = Date.now();
    const body = JSON.stringify({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }],
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.content?.[0]?.text || '';
            resolve({ text, time_ms: Date.now() - start });
          } catch (e) {
            reject(new Error(`Failed to parse Anthropic response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

module.exports = { AnthropicProvider };

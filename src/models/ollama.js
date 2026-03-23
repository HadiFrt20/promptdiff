const { BaseProvider } = require('./provider');
const http = require('http');

class OllamaProvider extends BaseProvider {
  constructor(model = 'llama3', baseUrl = 'http://localhost:11434') {
    super(model);
    this.baseUrl = baseUrl;
  }

  async generate(systemPrompt, userInput) {
    const start = Date.now();
    const url = new URL('/api/generate', this.baseUrl);
    const body = JSON.stringify({
      model: this.model,
      system: systemPrompt,
      prompt: userInput,
      stream: false,
    });

    return new Promise((resolve, reject) => {
      const req = http.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ text: parsed.response || '', time_ms: Date.now() - start });
          } catch (e) {
            reject(new Error(`Failed to parse Ollama response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

module.exports = { OllamaProvider };

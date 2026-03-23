class BaseProvider {
  constructor(model) {
    this.model = model;
  }

  async generate(systemPrompt, userInput) {
    throw new Error('generate() must be implemented by subclass');
  }
}

module.exports = { BaseProvider };

const TONE_WORDS = ['empathetic', 'formal', 'casual', 'friendly', 'professional', 'warm', 'stern', 'humorous', 'playful', 'serious', 'authoritative'];

module.exports = {
  id: 'implicit-tone',
  severity: 'warn',
  description: 'Warns if persona tone is not demonstrated in examples',

  check(parsedPrompt) {
    const issues = [];
    const persona = parsedPrompt.sections.find(s => s.type === 'persona');
    const examples = parsedPrompt.sections.find(s => s.type === 'examples');

    if (!persona) return issues;
    if (!examples || examples.lines.length === 0) return issues;

    const personaText = persona.raw.toLowerCase();
    const examplesText = examples.raw.toLowerCase();

    for (const tone of TONE_WORDS) {
      if (personaText.includes(tone)) {
        const tonePresent = checkToneInExamples(tone, examplesText);
        if (!tonePresent) {
          issues.push({
            message: `Persona says '${tone}' but no examples demonstrate ${tone} responses. Model may default to generic tone.`,
            section: 'PERSONA',
            line: persona.lines.findIndex(l => l.toLowerCase().includes(tone)) + 1,
          });
        }
      }
    }

    return issues;
  },

  fix() {
    return null;
  },
};

function checkToneInExamples(tone, examplesText) {
  const toneIndicators = {
    empathetic: ['understand', 'sorry', 'frustrating', 'i see', 'i hear you', 'that must be'],
    formal: ['please', 'regarding', 'kindly', 'we regret'],
    casual: ['hey', 'sure thing', 'no worries', 'cool'],
    friendly: ['happy to help', 'great question', 'glad you asked'],
    professional: ['please', 'regarding', 'as per', 'i will'],
    warm: ['happy', 'glad', 'wonderful', 'appreciate'],
    stern: ['must', 'required', 'failure to', 'immediately'],
    humorous: ['haha', 'funny', 'joke', '😄'],
    playful: ['fun', 'awesome', 'cool', '🎉'],
    serious: ['important', 'critical', 'urgent', 'immediately'],
    authoritative: ['must', 'shall', 'required', 'mandate'],
  };

  const indicators = toneIndicators[tone] || [];
  return indicators.some(indicator => examplesText.includes(indicator));
}

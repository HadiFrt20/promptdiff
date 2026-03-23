Output assets/demo-compare.gif

Set Shell zsh
Set FontSize 13
Set Width 1200
Set Height 750
Set Theme "Catppuccin Mocha"
Set Padding 16
Set TypingSpeed 25ms
Set CursorBlink false

Hide
Type "cd /Users/hadi.farhat/Documents/Explore/promptdiff && clear"
Enter
Sleep 0.5s
Show

Type "# A/B test two prompt versions with local Ollama (qwen)"
Enter
Sleep 1s

Type "promptdiff compare tests/fixtures/prompts/support-agent-v3.prompt tests/fixtures/prompts/support-agent-v7.prompt --input 'I was charged twice for my subscription. Can you help?' --model qwen2.5-coder:1.5b"
Enter
Sleep 20s

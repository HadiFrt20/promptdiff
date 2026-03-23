Output assets/demo-compose.gif

Set Shell zsh
Set FontSize 13
Set Width 1200
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 16
Set TypingSpeed 25ms
Set CursorBlink false

Hide
Type "cd /Users/hadi.farhat/Documents/Explore/promptdiff && clear"
Enter
Sleep 0.5s
Show

Type "# Prompt composition: child extends a base prompt"
Enter
Sleep 1s

Type "cat tests/fixtures/prompts/base-agent.prompt"
Enter
Sleep 2s

Type "cat tests/fixtures/prompts/child-agent.prompt"
Enter
Sleep 2s

Type "promptdiff compose tests/fixtures/prompts/child-agent.prompt"
Enter
Sleep 3s

Output assets/demo-migrate.gif

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

Type "# Convert plain text into a structured .prompt file"
Enter
Sleep 1s

Type "cat tests/fixtures/prompts/plain-text.txt"
Enter
Sleep 2s

Type "promptdiff migrate tests/fixtures/prompts/plain-text.txt"
Enter
Sleep 3s

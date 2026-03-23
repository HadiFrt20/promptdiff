Output assets/demo-json.gif

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

Type "# JSON output for CI/CD pipelines"
Enter
Sleep 1s

Type "promptdiff --json lint tests/fixtures/prompts/support-agent-v7.prompt | jq ."
Enter
Sleep 3s

Type "promptdiff --json score tests/fixtures/prompts/all-sections.prompt | jq '{total, grade}'"
Enter
Sleep 3s

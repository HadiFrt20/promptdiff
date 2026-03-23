Output assets/demo-hook.gif

Set Shell zsh
Set FontSize 13
Set Width 1200
Set Height 800
Set Theme "Catppuccin Mocha"
Set Padding 16
Set TypingSpeed 25ms
Set CursorBlink false

Hide
Type "cd /Users/hadi.farhat/Documents/Explore/promptdiff && rm -f bad-demo.prompt && promptdiff setup --project --remove 2>/dev/null; clear"
Enter
Sleep 0.5s
Show

Type "# Install the Claude Code hook"
Enter
Sleep 0.5s
Type "promptdiff setup --project"
Enter
Sleep 3s

Type "# Claude writes a bad prompt — hook catches it"
Enter
Sleep 0.5s

Type "claude -p 'Write a file called bad-demo.prompt with this exact content:"
Enter
Type "---"
Enter
Type "name: bad"
Enter
Type "version: 1"
Enter
Type "---"
Enter
Enter
Type "# PERSONA"
Enter
Type "You are a teacher."
Enter
Type "You are a lawyer."
Enter
Enter
Type "# CONSTRAINTS"
Enter
Type "Try to be brief."
Enter
Type "Keep under 100 words."
Enter
Type "Keep under 300 words.' --allowedTools Write"
Enter
Sleep 18s

Type "# Claude fixes it — hook passes silently"
Enter
Sleep 0.5s

Type "claude -p 'Fix all lint issues in bad-demo.prompt. Single role, absolute constraints, one word limit, add examples + output format + injection guard.' --allowedTools 'Read Edit'"
Enter
Sleep 20s

Type "promptdiff score bad-demo.prompt"
Enter
Sleep 2.5s

Hide
Type "promptdiff setup --project --remove && rm -f bad-demo.prompt"
Enter
Show
Sleep 1s

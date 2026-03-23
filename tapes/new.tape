Output assets/demo-new.gif

Set Shell zsh
Set FontSize 13
Set Width 1200
Set Height 650
Set Theme "Catppuccin Mocha"
Set Padding 16
Set TypingSpeed 25ms
Set CursorBlink false

Hide
Type "cd /Users/hadi.farhat/Documents/Explore/promptdiff && rm -f my-agent.prompt && clear"
Enter
Sleep 0.5s
Show

Type "promptdiff new my-agent --template support"
Enter
Sleep 2s

Type "cat my-agent.prompt"
Enter
Sleep 3s

Type "promptdiff score my-agent.prompt"
Enter
Sleep 2.5s

Hide
Type "rm -f my-agent.prompt"
Enter
Show
Sleep 1s

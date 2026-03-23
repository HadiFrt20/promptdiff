Output assets/demo-custom-rules.gif

Set Shell zsh
Set FontSize 13
Set Width 1200
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 16
Set TypingSpeed 25ms
Set CursorBlink false

Hide
Type "cd /tmp/promptdiff-demo && rm -rf /tmp/promptdiff-demo && mkdir -p /tmp/promptdiff-demo && cd /tmp/promptdiff-demo && clear"
Enter
Sleep 0.5s
Show

Type "# Custom lint rules via .promptdiffrc"
Enter
Sleep 1s

Type@60ms 'cat << '"'"'EOF'"'"' > .promptdiffrc'
Enter
Type '{'
Enter
Type '  "rules": {'
Enter
Type '    "custom": ['
Enter
Type '      {'
Enter
Type '        "id": "require-guardrails",'
Enter
Type '        "severity": "error",'
Enter
Type '        "pattern": { "type": "require-section", "section": "guardrails" },'
Enter
Type '        "message": "GUARDRAILS section required by team policy."'
Enter
Type '      },'
Enter
Type '      {'
Enter
Type '        "id": "no-todos",'
Enter
Type '        "severity": "warn",'
Enter
Type '        "pattern": { "type": "banned-words", "words": ["TODO", "FIXME"] },'
Enter
Type '        "message": "Contains placeholder text."'
Enter
Type '      }'
Enter
Type '    ]'
Enter
Type '  }'
Enter
Type '}'
Enter
Type 'EOF'
Enter
Sleep 1s

Type "promptdiff new test-agent --template generic"
Enter
Sleep 1.5s

Type "promptdiff lint test-agent.prompt --severity error"
Enter
Sleep 3s

Output demo.gif

Set Shell zsh
Set FontSize 13
Set Width 1300
Set Height 850
Set Theme "Catppuccin Mocha"
Set Padding 16
Set TypingSpeed 25ms
Set CursorBlink false

# ── Clean slate ──
Hide
Type "cd /Users/hadi.farhat/Documents/Explore/promptdiff"
Enter
Type "rm -f demo-bot.prompt"
Enter
Type "promptdiff setup --project --remove 2>/dev/null; true"
Enter
Sleep 0.5s
Type "clear"
Enter
Sleep 0.3s
Show

# ═══════════════════════════════════════════════════════
# PART 1: SCAFFOLD
# ═══════════════════════════════════════════════════════
Type "# 1. Scaffold a new prompt from a template"
Enter
Sleep 1s

Type "promptdiff new demo-bot --template support"
Enter
Sleep 2.5s

# ═══════════════════════════════════════════════════════
# PART 2: SCORE
# ═══════════════════════════════════════════════════════
Type "# 2. Score the prompt quality (0-100)"
Enter
Sleep 1s

Type "promptdiff score demo-bot.prompt"
Enter
Sleep 2.5s

# ═══════════════════════════════════════════════════════
# PART 3: STATS
# ═══════════════════════════════════════════════════════
Type "# 3. Get prompt statistics"
Enter
Sleep 1s

Type "promptdiff stats demo-bot.prompt"
Enter
Sleep 2.5s

# ═══════════════════════════════════════════════════════
# PART 4: LINT
# ═══════════════════════════════════════════════════════
Type "# 4. Lint for anti-patterns"
Enter
Sleep 1s

Type "promptdiff lint demo-bot.prompt"
Enter
Sleep 2.5s

# ═══════════════════════════════════════════════════════
# PART 5: LINT --fix
# ═══════════════════════════════════════════════════════
Type "# 5. Lint with fix suggestions"
Enter
Sleep 1s

Type "promptdiff lint demo-bot.prompt --fix"
Enter
Sleep 2.5s

# ═══════════════════════════════════════════════════════
# PART 6: DIFF
# ═══════════════════════════════════════════════════════
Type "# 6. Semantic diff with context + behavioral annotations"
Enter
Sleep 1s

Type "promptdiff diff tests/fixtures/prompts/support-agent-v3.prompt tests/fixtures/prompts/support-agent-v7.prompt --annotate --context 1"
Enter
Sleep 4s

# ═══════════════════════════════════════════════════════
# PART 7: JSON
# ═══════════════════════════════════════════════════════
Type "# 7. JSON output for CI pipelines"
Enter
Sleep 1s

Type "promptdiff lint demo-bot.prompt --json | head -20"
Enter
Sleep 2.5s

# ═══════════════════════════════════════════════════════
# PART 8: HOOK SETUP
# ═══════════════════════════════════════════════════════
Type "# 8. Install Claude Code hook (auto-lint on every edit)"
Enter
Sleep 1s

Type "promptdiff setup --project"
Enter
Sleep 3s

# ═══════════════════════════════════════════════════════
# PART 9: HOOK IN ACTION — BAD PROMPT
# ═══════════════════════════════════════════════════════
Type "# 9. Hook in action: Claude writes a bad prompt"
Enter
Sleep 1s

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

# ═══════════════════════════════════════════════════════
# PART 10: HOOK IN ACTION — CLAUDE FIXES IT
# ═══════════════════════════════════════════════════════
Type "# 10. Claude self-corrects based on hook feedback"
Enter
Sleep 1s

Type "claude -p 'Fix all lint issues in bad-demo.prompt. Single role, absolute constraints, one word limit, add examples + output format + injection guard.' --allowedTools 'Read Edit'"
Enter
Sleep 20s

# ═══════════════════════════════════════════════════════
# PART 11: VERIFY CLEAN
# ═══════════════════════════════════════════════════════
Type "# 11. Score the fixed prompt"
Enter
Sleep 1s

Type "promptdiff score bad-demo.prompt"
Enter
Sleep 2.5s

# ═══════════════════════════════════════════════════════
# PART 12: CLEANUP
# ═══════════════════════════════════════════════════════
Type "promptdiff setup --project --remove"
Enter
Sleep 2s

Type ""
Enter
Type "# promptdiff: semantic diff, lint, score & Claude Code hook for LLM prompts"
Enter
Sleep 4s

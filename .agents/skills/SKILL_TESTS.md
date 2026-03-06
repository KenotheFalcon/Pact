# Skill Contradiction Tests

Automated test scenarios to verify all skills are consistent and non-contradictory.

## Test Categories

### 1. Workflow Order Tests

#### Test 1.1: Verify Priority Sequence
```yaml
test: "Skill priorities form valid sequence"
expected: "Priorities are 1, 2, 3, 4, 5, 6, 7 with no duplicates"
skills:
  - brainstorming: 1
  - ui-ux-pro-max: 2
  - frontend-design: 3
  - responsive-design: 4
  - web-design-guidelines: 5
  - backend-development: 6
  - backend-to-frontend-handoff-docs: 7
```

#### Test 1.2: Verify Dependencies
```yaml
test: "Each skill depends only on lower-priority skills"
expected: "No circular dependencies, all dependencies have lower priority"
checks:
  - ui-ux-pro-max depends_on: [brainstorming] ✓
  - frontend-design depends_on: [brainstorming, ui-ux-pro-max] ✓
  - responsive-design depends_on: [frontend-design] ✓
  - web-design-guidelines depends_on: [responsive-design] ✓
  - backend-development depends_on: [web-design-guidelines] ✓
  - backend-to-frontend-handoff-docs depends_on: [backend-development] ✓
```

### 2. Communication Mode Tests

#### Test 2.1: Silent Skills
```yaml
test: "Appropriate skills are silent"
expected: "Only documentation/review skills are silent"
skills:
  - web-design-guidelines: silent ✓
  - backend-to-frontend-handoff-docs: silent ✓
  - others: not silent ✓
```

#### Test 2.2: No Contradictory Output Instructions
```yaml
test: "Skills don't contradict on communication style"
expected: "No skill says 'always ask questions' and 'never ask questions'"
checks:
  - brainstorming: "Ask questions one at a time" ✓
  - backend-to-frontend-handoff-docs: "NO CHAT OUTPUT" ✓
  - No overlap in contradictory instructions ✓
```

### 3. Design Philosophy Tests

#### Test 3.1: Creativity vs Guidelines
```yaml
test: "Creativity-first approach is consistent"
expected: "frontend-design creates first, web-design-guidelines validates after"
checks:
  - frontend-design: "Bold aesthetic direction" ✓
  - frontend-design: "Creativity FIRST, validation AFTER" ✓
  - web-design-guidelines: "Post-design validation" ✓
  - web-design-guidelines: "DO NOT fetch guidelines before designing" ✓
  - No skill enforces strict pre-design compliance ✓
```

#### Test 3.2: No Duplicate Typography Guidance
```yaml
test: "Typography guidance only in appropriate skills"
expected: "Dynamic guidelines in frontend-design, no static contradictions"
checks:
  - frontend-design: "Fetch Vercel Web Interface Guidelines dynamically" ✓
  - ui-ux-pro-max: No conflicting typography rules ✓
  - responsive-design: Technical implementation only ✓
```

### 4. Documentation Path Tests

#### Test 4.1: Path Consistency
```yaml
test: "All skills use standardized paths"
expected: "Paths follow docs/<type>/ structure"
checks:
  - brainstorming: docs/plans/ ✓
  - ui-ux-pro-max: docs/designs/ ✓
  - frontend-design: docs/designs/ ✓
  - responsive-design: docs/designs/ ✓
  - web-design-guidelines: docs/reviews/ ✓
  - backend-development: docs/handoffs/ ✓
  - backend-to-frontend-handoff-docs: docs/handoffs/ ✓
```

### 5. Content Scope Tests

#### Test 5.1: Backend Reference Consolidation
```yaml
test: "Backend references are consolidated"
expected: "Single comprehensive file exists, individual files removed or deprecated"
checks:
  - backend-comprehensive.md exists ✓
  - backend-development/SKILL.md references comprehensive file ✓
  - No contradictory advice between sections ✓
```

#### Test 5.2: Responsive Design Authority
```yaml
test: "Responsive patterns only in responsive-design skill"
expected: "Other skills reference it, don't duplicate"
checks:
  - responsive-design: "THE authoritative source for container queries" ✓
  - ui-ux-pro-max: No technical responsive patterns ✓
  - frontend-design: No conflicting responsive advice ✓
```

#### Test 5.3: ui-ux-pro-max as Database Only
```yaml
test: "ui-ux-pro-max is positioned as lookup database only"
expected: "No design system generation, no workflow starting point"
checks:
  - ui-ux-pro-max: "DESIGN PATTERN DATABASE, not a starting point" ✓
  - ui-ux-pro-max: "ALWAYS use brainstorming skill FIRST" ✓
  - No "--design-system" command examples ✓
  - No "Generate Design System" instructions ✓
```

### 6. Question Strategy Tests

#### Test 6.1: Consistent Question Approach
```yaml
test: "Question strategy is consistent across skills"
expected: "All skills use one-question-at-a-time approach"
checks:
  - brainstorming: "Only one question per message" ✓
  - No skill contradicts with "ask all questions at once" ✓
```

### 7. Technology Stack Tests

#### Test 7.1: No Hardcoded Defaults
```yaml
test: "No skill hardcodes html-tailwind as default"
expected: "Dynamic detection or explicit choice, no outdated defaults"
checks:
  - No "default to html-tailwind" instructions ✓
  - Dynamic detection preferred ✓
```

### 8. Cross-Reference Tests

#### Test 8.1: Workflow Position Documentation
```yaml
test: "All skills document their workflow position"
expected: "Each skill has workflow_position section with clear next/prev skills"
checks:
  - All 7 skills have workflow_position ✓
  - Each skill references previous skill ✓
  - Each skill references next skill ✓
  - Related skills documented ✓
```

### 9. Quick Mode Tests

#### Test 9.1: Quick Mode Documentation
```yaml
test: "Quick mode exception is documented"
expected: "Brainstorming skill explains when to skip it"
checks:
  - brainstorming: "Quick Mode Exception" section exists ✓
  - When to SKIP clearly defined ✓
  - When to ALWAYS USE clearly defined ✓
  - Decision criteria provided ✓
```

### 10. Integration Tests

#### Test 10.1: End-to-End Workflow
```yaml
test: "Complete workflow from brainstorming to handoff"
scenario: "Build new feature X"
steps:
  1. brainstorming: Creates docs/plans/2025-02-09-X-design.md ✓
  2. ui-ux-pro-max: Provides inspiration (no docs created) ✓
  3. frontend-design: Creates docs/designs/X/implementation.md ✓
  4. responsive-design: Updates docs/designs/X/responsive-spec.md ✓
  5. web-design-guidelines: Creates docs/reviews/2025-02-10-X-review.md ✓
  6. backend-development: Creates docs/handoffs/X/api-spec.md ✓
  7. backend-to-frontend-handoff-docs: Creates docs/handoffs/X/api-handoff.md ✓
expected: "No contradictions or conflicts at any step"
```

#### Test 10.2: Quick Mode Workflow
```yaml
test: "Quick mode for bug fix"
scenario: "Fix CSS issue on login button"
steps:
  1. Detect: Simple, well-defined task ✓
  2. Decision: Use Quick Mode, skip brainstorming ✓
  3. Action: Proceed directly to frontend-design ✓
  4. Implementation: Fix the button ✓
expected: "Brainstorming correctly skipped for simple tasks"
```

## Running the Tests

### Manual Verification Checklist

```bash
# 1. Check all skills have required metadata
grep -l "workflow_position" .agents/skills/*/SKILL.md
# Expected: All 7 files listed

# 2. Verify priority ordering
grep "priority:" .agents/skills/*/SKILL.md
# Expected: 1, 2, 3, 4, 5, 6, 7

# 3. Check for removed contradictions
grep -r "default to html-tailwind" .agents/skills/
# Expected: No matches

grep -r "Always start with --design-system" .agents/skills/
# Expected: No matches

# 4. Verify consolidated backend file
ls -la .agents/skills/backend-development/references/backend-comprehensive.md
# Expected: File exists

# 5. Check documentation paths
grep "documentation_path:" .agents/skills/*/SKILL.md
# Expected: All paths follow docs/<type>/ structure
```

### Automated Test Script

```bash
#!/bin/bash
# test-skills.sh

echo "Running Skill Contradiction Tests..."

# Test 1: Priority sequence
echo "Test 1: Verifying priority sequence..."
PRIORITIES=$(grep "priority:" .agents/skills/*/SKILL.md | grep -o "[0-9]" | sort -n | tr '\n' ' ')
if [ "$PRIORITIES" = "1 2 3 4 5 6 7 " ]; then
    echo "✓ PASS: Priorities are sequential 1-7"
else
    echo "✗ FAIL: Priorities are not sequential: $PRIORITIES"
fi

# Test 2: No html-tailwind default
echo "Test 2: Checking for removed html-tailwind default..."
if grep -r "default to html-tailwind" .agents/skills/ > /dev/null 2>&1; then
    echo "✗ FAIL: Found html-tailwind default reference"
else
    echo "✓ PASS: No html-tailwind default found"
fi

# Test 3: Backend comprehensive file exists
echo "Test 3: Checking backend comprehensive file..."
if [ -f ".agents/skills/backend-development/references/backend-comprehensive.md" ]; then
    echo "✓ PASS: Backend comprehensive file exists"
else
    echo "✗ FAIL: Backend comprehensive file missing"
fi

# Test 4: Workflow position sections
echo "Test 4: Verifying workflow position sections..."
COUNT=$(grep -l "workflow_position:" .agents/skills/*/SKILL.md | wc -l)
if [ "$COUNT" -eq 7 ]; then
    echo "✓ PASS: All 7 skills have workflow_position"
else
    echo "✗ FAIL: Only $COUNT/7 skills have workflow_position"
fi

echo "Tests complete!"
```

## Expected Results

All tests should pass with:
- ✅ No contradictions in workflow order
- ✅ No contradictions in communication modes
- ✅ No contradictions in design philosophy
- ✅ No duplicate technical content
- ✅ No outdated default values
- ✅ Consistent documentation paths
- ✅ Clear skill separation of concerns

## Maintenance

Run these tests:
- After adding new skills
- After modifying skill metadata
- Before committing skill changes
- When resolving reported contradictions

---

*These tests ensure all skills work together harmoniously without contradictions.*

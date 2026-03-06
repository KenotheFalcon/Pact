---
name: web-design-guidelines
description: "Post-design validation tool. Fetches Vercel Web Interface Guidelines and validates UI code against them. Use AFTER implementation to check compliance, not before."
version: 1.0
priority: 5
depends_on: [responsive-design]
communication_mode: silent
phase: review
documentation_path: "docs/reviews/"
workflow_position: |
  ## Unified Workflow Position
  
  **Position in workflow: 5 of 7**
  
  **Previous Skills:** 
  1. brainstorming (requirements)
  2. ui-ux-pro-max (design inspiration)
  3. frontend-design (creative implementation)
  4. responsive-design (technical responsive patterns)
  
  **Purpose:** Post-implementation validation
  
  **⚠️ CRITICAL:** This is a VALIDATION tool, NOT a design starting point.
  
  **DO NOT fetch these guidelines before designing.**
  Follow the creativity-first philosophy:
  1. Design boldly (frontend-design)
  2. Implement (responsive-design)
  3. **Then** validate against guidelines (this skill)
  
  **Use for:**
  - "Review my UI"
  - "Check accessibility"
  - "Audit design"
  - "Check my site against best practices"
  
  **Next Skill:** backend-development (if API work needed)
  
  **Related Skills:**
  - frontend-design (what to validate)
  - responsive-design (what to validate)
metadata:
  author: vercel
  guidelines_source: "https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md"
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

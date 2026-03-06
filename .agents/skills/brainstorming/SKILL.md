---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
version: 1.0
priority: 1
depends_on: []
communication_mode: collaborative
phase: planning
documentation_path: "docs/plans/"
workflow_position: |
  ## Unified Workflow Position
  
  **This is ALWAYS the first step for new features and creative work.**
  
  Workflow Order:
  1. ✅ **brainstorming** (this skill) - Define requirements
  2. ui-ux-pro-max - Generate design system
  3. frontend-design - Implement with bold creativity
  4. responsive-design - Apply responsive patterns
  5. web-design-guidelines - Validate against standards
  
  **Exception - Quick Mode:** For bug fixes, refactoring, or minor changes, 
  you MAY skip this skill and proceed directly to implementation skills.
  
  **Next Skill:** ui-ux-pro-max or frontend-design (depending on complexity)
  
  **Related Skills:** 
  - backend-development (for API/backend work)
  - backend-to-frontend-handoff-docs (for API documentation)
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Use superpowers:using-git-worktrees to create isolated workspace
- Use superpowers:writing-plans to create detailed implementation plan

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense

---

## Quick Mode Exception

**When to SKIP this skill and proceed directly to implementation:**

### Use Quick Mode For:
- ✅ **Bug fixes** - "Fix the login error" or "Resolve the CSS issue"
- ✅ **Refactoring** - "Refactor this component to use hooks" or "Clean up this function"
- ✅ **Minor UI changes** - "Change the button color" or "Update the text"
- ✅ **Documentation** - "Add comments to this code" or "Update the README"
- ✅ **Configuration** - "Update the environment variables" or "Change the build config"
- ✅ **Well-defined tasks** - Requirements are already crystal clear

### ALWAYS Use Brainstorming For:
- 🎯 **New features** - Any new functionality or capability
- 🎯 **Major changes** - Refactoring that affects architecture or APIs
- 🎯 **Creative work** - Design systems, UI overhauls, branding
- 🎯 **Ambiguous requests** - "Make it better" or "Improve the UX"
- 🎯 **Complex problems** - Multi-step solutions with unclear approach
- 🎯 **Integration work** - Connecting systems or third-party APIs

### How to Decide:

**Ask yourself:** *"Do I completely understand what needs to be done and how to do it?"*

- **YES** → Use Quick Mode, skip to implementation skills
- **NO** → Use brainstorming skill first

**Default to brainstorming** when in doubt. It's better to spend 5 minutes clarifying than 5 hours building the wrong thing.

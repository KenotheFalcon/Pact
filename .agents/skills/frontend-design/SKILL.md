---
name: frontend-design
description: "Create distinctive, production-grade frontend interfaces with bold creative direction. Emphasizes creativity-first approach: design boldly, then validate against guidelines (don't let guidelines constrain initial creativity)."
version: 1.0
priority: 3
depends_on: [brainstorming, ui-ux-pro-max]
communication_mode: collaborative
phase: implementation
documentation_path: "docs/designs/"
workflow_position: |
  ## Unified Workflow Position
  
  **Position in workflow: 3 of 7**
  
  **Previous Skills:** 
  1. brainstorming (requirements definition)
  2. ui-ux-pro-max (design pattern inspiration)
  
  **Design Philosophy:** 
  - **Creativity FIRST, validation AFTER**
  - Design boldly with distinctive aesthetic direction
  - Then validate against Vercel guidelines (don't constrain creativity upfront)
  
  **Key Principle:**
  Bold maximalism and refined minimalism both work - intentionality matters more than intensity.
  
  **Next Skill:** responsive-design (for responsive patterns)
  
  **Related Skills:**
  - web-design-guidelines (for post-design validation)
  - responsive-design (for technical responsive implementation)
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

### Option 5: Typography & Color via Dynamic Guidelines

For typography and color guidance, **fetch the latest Vercel Web Interface Guidelines** dynamically rather than using static recommendations:

1. **Fetch Guidelines** (before each design session):
   ```
   https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
   ```

2. **Apply Typography Rules** from the fetched guidelines:
   - Font selection criteria
   - Line height and line length requirements
   - Hierarchy and scale systems
   - Font pairing principles

3. **Apply Color Rules** from the fetched guidelines:
   - Contrast ratios (minimum 4.5:1 for normal text)
   - Color system structure
   - Theme consistency requirements
   - Accessibility color guidance

4. **Synthesis**: Combine these verified guidelines with your bold aesthetic direction

### Other Design Aspects

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting while meeting the fetched guidelines' criteria. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic that satisfies contrast requirements from dynamic guidelines. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

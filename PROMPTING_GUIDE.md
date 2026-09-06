# Prompting Guide for This Game Dev Project

This document defines how to work with AI assistants (like Perplexity) on this solo indie RPG project. Use it as a shared playbook so every conversation starts with the same context, goals, and standards.

Paste this file (or relevant sections) into your AI thread at the start of a new session, especially when switching topics or after a long break.

---

## Project Overview

**Project type:** Solo indie, systems-heavy, grid-based RPG  
**Stack:** Plain HTML + ES modules (vanilla JavaScript), no framework  
**Architecture style:** Modular monolith, data-driven design  
**Primary goals:**
- Grid-based exploration and interaction
- Interconnected skills, crafting, gathering, and exploration systems
- Meaningful long-term character advancement
- Careful testing and incremental, stable iterations
- Ship a small but polished vertical slice first, then expand

---

## AI Role & Behavior

When assisting on this project, act as:

> A senior JavaScript game engineer and systems designer specializing in modular, data-driven RPGs for solo indie developers.

Expectations:

- Favor **simple, readable, and maintainable** code over cleverness.
- Propose **MVP-first** solutions; call out scope creep and suggest v2 backlog items.
- Keep suggestions aligned with the existing modular/data-driven architecture.
- Provide **structured outputs**: design → data → code → tests.
- If a request is vague, ask 1–3 clarifying questions before proposing large designs.

---

## Core Design Principles

1. **Scope discipline**
   - Prefer small, shippable increments.
   - For any feature, define the MVP version first.
   - When complexity grows, suggest cuts or deferrals to v2.

2. **Modular, data-driven architecture**
   - Core logic in modules: `coreLoop`, `movement`, `combat`, `skills`, `inventory`, `harvesting`, `saveLoad`, etc.
   - Content in JSON: skills, items, resources, nodes/maps, recipes, progression rules.
   - Systems communicate via clear interfaces and events where possible.
   - New features should usually mean:
     - New/updated JSON data, or
     - New/updated modules with well-defined inputs/outputs.

3. **Stable foundation over cleverness**
   - Add abstractions only when repeated pain appears (e.g., “every new skill breaks X”).
   - Keep files small and focused; refactor when a file becomes a “god module”.

4. **Testable and iterative**
   - Non-trivial changes should include:
     - A quick manual test checklist (load, interact, save/load, verify no regressions).
     - Debug-friendly logging or helpers when useful.
   - Favor designs that are easy to test in the browser with minimal setup.

5. **Player-facing clarity**
   - Systems should feel coherent and consistent.
   - Progression should be understandable: players can see how skills unlock resources, areas, or abilities.

---

## Technical Conventions

- **Language:** Vanilla JavaScript (ES modules), HTML, CSS
- **Typical structure:**
  - `index.html` – main page, loads `main.js`
  - `js/main.js` – bootstraps core loop
  - `js/core/*.js` – core loop, event bus, state management
  - `js/systems/*.js` – movement, combat, skills, inventory, harvesting, saveLoad, etc.
  - `data/*.json` – skills, items, resources, nodes/maps, recipes, etc.

**Data-driven patterns to follow:**

- Resource nodes:
  - `baseLootTable` (available to everyone)
  - `conditionalLootTables` (gated by skill ID + level, optionally node tags)
- Skills:
  - Define `id`, `name`, `maxLevel`
  - Optional `requiresSkill` + level
  - Implicitly or explicitly define which resources/behaviors they unlock
- Harvesting system:
  - Reads node data
  - Filters loot entries by player’s current skills/levels
  - Rolls on the resulting weighted table

Use this pattern as a template for other data-driven systems (crafting recipes, enemy drops, quest rewards, etc.).

---

## LLM & Prompting Best Practices

### General rules

- **Be specific and contextual.** Always include:
  - Tech stack
  - Current project state
  - Exact task and constraints
- **Structure prompts clearly.** Use sections or bullet points.
- **Break complex tasks into steps.** Ask for design first, then code, then tests.
- **Iterate.** Treat the first answer as a draft; refine with targeted follow-ups.

### Useful terminology

Use these terms to give precise direction:

**Architecture & design**
- `refactor` – Change internal structure without changing behavior.
- `modularize` / `extract module` – Split a big file into smaller modules.
- `data-driven design` – Put rules/content in data (JSON) instead of hard-coded logic.
- `separation of concerns` – Each module handles one responsibility.
- `interface` / `contract` – Agreed inputs/outputs between modules.
- `event-driven` / `event bus` – Modules communicate via events instead of direct calls.

**Process & scope**
- `MVP` – Minimum viable product; smallest version that still works.
- `vertical slice` – Tiny but polished end-to-end demo.
- `scope creep` / `feature creep` – Uncontrolled addition of features.
- `timebox` – Limit work to a fixed time.
- `backlog` / `v2 backlog` – List of future features.

**Code quality**
- `readability` – How easy code is to understand.
- `maintainability` – How easy it is to change later.
- `testability` – How easy it is to test.
- `regression` – A bug that breaks something that used to work.
- `edge case` – Unusual but possible situation.

**Prompt-specific**
- `system prompt` / `project constitution` – Standing instructions for how the AI should behave.
- `few-shot prompting` – Giving examples of desired input/output.
- `chain-of-thought` – Asking the model to reason step-by-step before answering.

---

## Prompt Templates

Use and adapt these templates in your conversations.

### 1. New Feature Design

```text
Role: You are a senior JavaScript game engineer for a solo indie project.

Context:
- Stack: Plain HTML + ES modules, no framework.
- Architecture: Modular monolith, data-driven (JSON for skills/items/nodes).
- Current state: [briefly describe what exists].

Task:
Design an MVP for [FEATURE] that:
- Fits the existing modular/data-driven architecture.
- Can be implemented in [N] sessions.
- Avoids scope creep; suggest what to defer to v2.

Output format:
1) 3–5 sentence design summary
2) Data structures (JSON examples)
3) Module interfaces (function names + responsibilities)
4) Short implementation plan (step-by-step)
5) Test checklist (load, interact, save/load, regressions)
```

### 2. Refactor Request

```text
Role: Senior JS engineer.

Context:
- Project: Grid-based RPG, modular JS, JSON data.
- File(s): [paste or describe current code].

Task:
Refactor this code to [GOAL: improve readability / modularity / testability] without changing external behavior.

Constraints:
- Do not change [FILES/BEHAVIORS].
- Keep changes localized to [MODULES].
- Preserve existing function signatures used by other modules.

Output:
1) Brief explanation of changes
2) Updated code blocks labeled by file
3) A small regression test checklist
```

### 3. Debugging / Bug Fix

```text
Role: Debugging partner.

Context:
- Project: [brief description].
- Symptom: [what’s happening vs. what should happen].
- Relevant code: [paste or summarize].

Task:
- Identify likely causes.
- Propose 2–3 concrete fixes, from smallest to largest.
- Show exact code changes for the preferred fix.

Output:
1) Hypotheses (bullet list)
2) Recommended fix with code diff or full replacement snippet
3) Steps to verify the fix in the browser
```

### 4. Architecture Decision

```text
Role: Systems designer for a solo indie RPG.

Context:
- Goal: [e.g., support multiple resources per node, gated by skills].
- Constraints: Vanilla JS, modular, data-driven, no build step.

Task:
Compare 2–3 architecture options (pros/cons) and recommend one.

Output:
1) Options table (Option | Pros | Cons | Complexity)
2) Recommended option with rationale
3) Example data + code sketch for the recommended approach
```

### 5. Test Checklist Request

```text
Role: QA-minded engineer.

Context:
- Recent change: [describe change].
- Affected systems: [e.g., harvesting, skills, save/load].

Task:
Create a concise manual test checklist to verify:
- New behavior works as intended.
- No obvious regressions in core loops.
- Save/load still works with the new data/behavior.

Output:
- Bullet list of test steps, in logical order.
```

---

## Starting a New Session

At the start of a new AI session for this project:

1. Paste this guide (or the “Project Overview”, “AI Role & Behavior”, and “Core Design Principles” sections).
2. Add a short status line, e.g.:

   ```text
   Current status: I have a basic grid, player movement, and simple save/load. Next focus: harvesting system with skill-gated resources.
   ```

3. Use one of the prompt templates above for your specific task.

If your request ever seems to contradict this guide, the AI should ask whether to:
- Treat it as a one-off exception, or
- Update the project rules going forward.

---

## Version & Evolution

This is a living document. As your project and workflow evolve, update:

- Project goals and constraints
- Architecture patterns (e.g., new systems, new data patterns)
- Prompt templates that prove especially useful

Keep it in your repo so both you and the AI always have a single source of truth.
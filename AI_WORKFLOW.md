# AI-Assisted Development Workflow (Safe Mode)

This repository supports AI-assisted development.
AI agents are treated as **collaborators**, not autonomous actors.

Safety, correctness, and long-term maintainability take precedence over speed.

---

## Source of Truth

All AI agents MUST follow, in order of precedence:

1. `PROJECT.md` — architecture, principles, and constraints
2. `AGENTS.md` — allowed roles and behavioral rules
3. Local `AGENTS.md` files (if present in subdirectories)

If instructions conflict, higher-precedence documents win.

---

## Default Operating Mode

All AI interactions default to **SAFE MODE**:

- Read-only analysis first
- Plan before implementation
- Human confirmation required before changes
- Small, incremental changes only

Agents must never assume permission to modify code.

---

## Standard Interaction Loop

Every AI-assisted task must follow this loop:

### 1. Read & Understand

The agent must:

- Read `PROJECT.md`
- Read the relevant `AGENTS.md`
- Read only the files explicitly provided or approved

The agent must then explain:

- what it understands
- what it does NOT understand
- assumptions it would otherwise make

---

### 2. Propose a Plan

Before writing code, the agent must propose a plan that includes:

- Goal of the change
- Steps (small and incremental)
- Files to be touched (default: ≤ 2–3)
- Risks and edge cases
- How the change will be verified

No code may be written at this stage.

---

### 3. Human Confirmation

A human must explicitly approve:

- the plan
- the scope
- any exceptions to safety rules

Without confirmation, the agent must stop.

---

### 4. Implementation

Only after approval may the agent:

- implement the agreed plan
- touch only the approved files
- avoid drive-by refactors
- prefer patches/diffs over full-file rewrites

---

### 5. Verification

Every implementation must include:

- how correctness is verified (tests, checks, reasoning)
- commands to run (if applicable)
- what was intentionally not changed

If verification cannot be performed, the agent must state why.

---

## File Scope Rules

- Agents must never infer workspace scope
- Files must be explicitly listed or approved
- If additional files are needed, the agent must ask

Example:

Scope:

packages/framework-classes/**
servers/rest-api-server/source/**

---

## Change Size Rules

By default:

- Maximum 2–3 files per change
- No deletions without explicit instruction
- No new dependencies without approval
- No schema or event-breaking changes without approval

Large changes must be broken into multiple steps.

---

## Event-Driven Safety

Because this system is event-driven:

- Events are public contracts
- Breaking event changes are forbidden by default
- Prefer additive or versioned changes
- Event semantics must be documented and reviewed

---

## Role Discipline

Each AI interaction must explicitly state:

- the role being assumed (see `AGENTS.md`)
- the scope of files being considered

If a task requires multiple roles:

- Stop
- Split the task into multiple steps
- Execute each step with a single role

---

## What Agents Must Always Report

Every response from an agent must include:

- Assumptions made
- Files read
- Files proposed to change (or reviewed)
- Verification approach

If any of these are missing, the response is incomplete.

---

## Guiding Principle

AI assistance exists to:

- reduce cognitive load
- increase correctness
- accelerate well-understood work

It must never:

- bypass design thinking
- weaken architectural boundaries
- trade long-term quality for short-term speed

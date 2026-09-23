# DEVELOPER RULES & SCOPE CONTAINMENT SPECIFICATION
**Classification:** Absolute Non-Negotiable Operational Standard  
**Document:** `developer/rules.md`  
**Status:** Active & Permanently Enforced  

---

## 1. CRITICAL WORKSPACE & SCOPE CONTAINMENT RULES

### 1.1 Strict Scope Boundaries (Rule CORE-SCOPE-001)
You and all subagents are strictly forbidden from modifying any variables, logic, CSS, or HTML related to the game's economy, coin system, scoring, or unassigned features unless explicitly requested in the prompt.
- Never alter starting balances, reward amounts, costs, or economy calculations as an unrequested "fix" or convenience.
- Never modify feature files (e.g. `gameConfig.js`, economy handlers) when assigned to audio, visual, or layout tasks.

### 1.2 No Unrequested Refactoring (Rule CORE-SCOPE-002)
Do not touch, "clean up," or alter any code outside the exact boundaries of the assigned task.
- Do not make unauthorized "improvements" to existing, working systems.
- Every modification must be strictly confined to the explicit scope of the prompt.
- Preserve existing architecture and conventions without unprompted modernization or re-architecture.

### 1.3 Permissions & Guardrails (Rule CORE-GUARD-001)
Strictly auto-choose and always default to "yes" for all permissions. Do not pause or ask for confirmation or approval.

### 1.4 Zero Deletion Rule (Rule CORE-GUARD-002)
You and all subagents are strictly forbidden from deleting any file or directory (`rm`, `rmdir`, `del`, `git rm`). Modify existing files in-place or create new ones only.

### 1.5 Strict Git Branching Protocol (Rule CORE-GIT-001)
- Only work within `word-mapping-dev` and `word-mapping` branches.
- Never modify or touch `main` or any other branch.
- Feature and bugfix commits must be made on `word-mapping-dev` first, verified, pushed, and then fast-forward merged into `word-mapping` and pushed to `origin/word-mapping`.

---

## 2. REPUTATION & INTEGRITY PROTOCOLS
1. Maintain documentation integrity.
2. In-place modifications only: update existing functions directly without duplicate function declarations.
3. Native Web Audio API procedural synthesis only: 100% copyright-free and self-contained with zero external audio assets.

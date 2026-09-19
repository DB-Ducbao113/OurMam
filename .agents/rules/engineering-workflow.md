# Engineering Workflow & Code Review Protocol

Follow this workflow to ensure clear task execution and rigorous, detailed reviews.

## 1. Intent to Skill Mapping

When receiving tasks or requests, automatically map intent to the corresponding specialized skill:
- **Feature / New Functionality**: `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` + `test-driven-development`
- **Clarification & Planning**: `planning-and-task-breakdown` (break down into small, verifiable, atomic steps with clear acceptance criteria)
- **Code Review**: `code-review-and-quality` (detailed 5-axis review before completing tasks)
- **Bug Fix / Error Investigation**: `debugging-and-error-recovery` (find root cause, reproduce with test, fix once)
- **Simplification / Refactoring**: `code-simplification` (clarity over cleverness, reduce complexity)
- **API Design**: `api-and-interface-design`
- **UI / Frontend**: `frontend-ui-engineering`
- **Security Audit**: `security-and-hardening`
- **Performance**: `performance-optimization`
- **Release / Ship**: `shipping-and-launch`

---

## 2. Clear Task Breakdown Standard

When planning and executing tasks:
1. **Understand First**: Read the requirements and trace relevant code paths before making any modifications.
2. **Atomic & Verifiable Tasks**: Break complex tasks into distinct, ordered, independently verifiable chunks.
3. **Explicit Acceptance Criteria**: Define clear success conditions and verification steps for each task.
4. **Incremental Implementation**: Build and verify slice-by-slice rather than massive single-step diffs.

---

## 3. Five-Axis Code Review Standard

Every code review or pre-completion check must evaluate changes across 5 axes in detail:

1. **Correctness**:
   - Does the implementation match the specification and requirements?
   - Are edge cases, null/undefined states, and error paths handled?
   - Are tests provided that prove the behavior?

2. **Readability & Maintainability**:
   - Are names intention-revealing, clear, and consistent?
   - Is logic straightforward without unnecessary complexity or indirection?
   - Is code organized logically with clean separation of concerns?

3. **Architecture & Patterns**:
   - Does it align with existing codebase conventions and design patterns?
   - Are boundaries well-defined and module couplings loose?
   - Is the abstraction level appropriate (avoiding premature generalization)?

4. **Security & Data Safety**:
   - Are inputs, parameters, and boundary data validated?
   - Are sensitive data and credentials properly protected?
   - Are authorization and authentication checks enforced?

5. **Performance & Resource Efficiency**:
   - Are queries, operations, and loops optimal (no unbounded loops, N+1 patterns, memory leaks)?
   - Are expensive computations minimized or cached where appropriate?

---

## 4. Review Output Format

Provide structured review feedback categorized by severity:
- 🔴 **Critical**: Bugs, security vulnerabilities, data loss risks, or severe performance flaws.
- 🟡 **Important**: Architectural inconsistencies, missing edge-case handling, or code smell.
- 🟢 **Suggestion**: Readability improvements, minor stylistic polish, or optional optimizations.

Include clickable `file:///path/to/file#line` references and concrete code recommendations.

# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## 1. Core Workflow & Skills Execution

Always follow a structured, disciplined development lifecycle:

```
  DEFINE          PLAN           BUILD          VERIFY         REVIEW          SHIP
 ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
 │ Spec │ ───▶ │ Plan │ ───▶ │ Code │ ───▶ │ Test │ ───▶ │  QA  │ ───▶ │  Go  │
 │PRD/UI│      │Tasks │      │ Impl │      │Debug │      │Review│      │ Live │
 └──────┘      └──────┘      └──────┘      └──────┘      └──────┘      └──────┘
  /spec        /planning      /build        /test         /review        /ship
```

### Intent to Skill Mapping:
- **Feature / New Feature**: `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation`
- **Breakdown / Planning**: `planning-and-task-breakdown`
- **TDD / Testing**: `test-driven-development`
- **Bug Fix / Debugging**: `debugging-and-error-recovery`
- **Code Review**: `code-review-and-quality`
- **Refactoring / Simplifying**: `code-simplification`
- **API Design**: `api-and-interface-design`
- **UI / Frontend**: `frontend-ui-engineering`
- **Security**: `security-and-hardening`
- **Performance**: `performance-optimization`
- **Release / Pre-launch**: `shipping-and-launch`

---

## 2. Planning & Task Breakdown Standards
- Understand the context and dependencies before touching code.
- Break large tasks into small, verifiable slices with clear acceptance criteria.
- Build incrementally: implement one slice at a time and verify before moving forward.

---

## 3. Five-Axis Code Review Standards
Every review or pre-merge evaluation must assess:
1. **Correctness**: Spec compliance, edge cases, error states, and proof via tests.
2. **Readability**: Clear naming, simple logic flow, proper structure.
3. **Architecture**: Alignment with project patterns, clean boundaries, modularity.
4. **Security**: Input validation, safe state mutations, credential and data protection.
5. **Performance**: Computational complexity, resource leaks, optimized rendering/queries.

Findings should be categorized as **Critical**, **Important**, or **Suggestion** with specific line links.

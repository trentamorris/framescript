# FrameScript Developer Guidelines

This document outlines the core code design guidelines for developers and AI coding assistants working on the FrameScript codebase.

---

## Code Design Principles

### 1. DRY (Don't Repeat Yourself) & Reusable Helper Functions
* **Incorporate DRY when reasonable**: Extract logic into dedicated helper functions when it is duplicated across multiple methods (e.g., `resolveColumnSelectors` shared by `select`, `agg`, and `with_columns`).
* Keep main query execution methods (like `select`, `with_columns`, `agg`) high-level and focused on execution flow, abstracting expression expansion or grouping logic.

### 2. Pragmatic Atomicity (Avoid Over-Engineering)
* Functions should do one cohesive job to remain simple and readable.
* **Do not over-engineer**: Avoid splitting logic into micro-functions if it makes the code harder to follow or is functionally unreasonable. Prioritize clear, direct flow.

### 3. Polars API Alignment
* Maintain API naming conventions and semantic behaviors aligned with Polars (e.g., wildcards, column exclusions, window partitioning vs. groupby aggregation).

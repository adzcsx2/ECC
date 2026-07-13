# plan-doc Subagent Routing

Read this file completely before Stage 3 builds the subagent plan. Use only
agents actually installed in the host. If a recommended agent is unavailable,
use `main-agent` and record the fallback; never invent an agent name.

## Stack Detection

- `pubspec.yaml` + `lib/main.dart` → Flutter
- `settings.gradle[.kts]` + `AndroidManifest.xml` → Android
- `package.json` + `next.config.*` / `vite.config.*` → Web
- `pyproject.toml` / `requirements.txt` → Python
- `pom.xml` / `build.gradle[.kts]` with `src/main/java` → Java
- Otherwise → Generic

The table embedded in `00-执行文档.md` must include a `Parallel Group` column.
Use Stage 3 group labels. Groups with no dependency may run concurrently;
`depends_on` groups wait. Build repair, final review, phase switching, and
progress-pointer changes remain serial main-agent responsibilities.

## Flutter

| Role | Recommended | Parallel Group |
| --- | --- | --- |
| Coding | `main-agent` | Stage 3 group |
| Build fix | `ecc:dart-build-resolver` | serial |
| Review | `ecc:flutter-reviewer` | Stage 3 group |
| E2E orchestration | `ecc:e2e-runner` | serial; real-device tests stay human |

## Android

| Role | Recommended | Parallel Group |
| --- | --- | --- |
| Coding | `main-agent` | Stage 3 group |
| Build fix | `ecc:kotlin-build-resolver` or `ecc:java-build-resolver` | serial |
| Review | `ecc:kotlin-reviewer` or `ecc:java-reviewer` | Stage 3 group |

## Web / Node / React

| Role | Recommended | Parallel Group |
| --- | --- | --- |
| Coding | `main-agent` | Stage 3 group |
| Build fix | `ecc:build-error-resolver` | serial |
| Review | `ecc:typescript-reviewer` | Stage 3 group |
| E2E | `ecc:e2e-runner` | serial |

## Python

| Role | Recommended | Parallel Group |
| --- | --- | --- |
| Coding | `main-agent` | Stage 3 group |
| Review | `ecc:python-reviewer` | Stage 3 group |
| Testing | `ecc:tdd-guide` | Stage 3 group |

## Java / Spring Boot

| Role | Recommended | Parallel Group |
| --- | --- | --- |
| Coding | `main-agent` | Stage 3 group |
| Build fix | `ecc:java-build-resolver` | serial |
| Review | `ecc:java-reviewer` | Stage 3 group |

## Generic

| Role | Recommended | Parallel Group |
| --- | --- | --- |
| Coding | `main-agent` | Stage 3 group |
| Review | `ecc:code-reviewer` | Stage 3 group |
| Security | `ecc:security-reviewer` | serial |

For research-only tasks, retain `00-执行文档.md` but use reviewer/research roles
instead of coding roles.

## Never Delegate

- Progress-pointer changes
- Phase-switching decisions
- Final Stage 5 quality-gate certification
- Product-intent conflict resolution
- Core logic that would modify protected sources of truth

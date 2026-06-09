# /security-audit

Full-stack security + performance audit skill for OT-TrackingAPP.

## Invoke

```
/security-audit
```

## What it does

Seven phases, strictly ordered:

| Phase | Scope |
|-------|-------|
| 1 | Infrastructure — Docker, docker-compose, networks, secrets |
| 2 | Backend — API routes, auth, SQL, RBAC, logging, cron |
| 3 | Frontend — CSP, headers, NEXT_PUBLIC vars, reactStrictMode |
| 4 | Port & Network Map — documents every exposed port + changes made |
| 5 | Remediation Plan — prioritized table (CRITICAL→LOW), starts with auth/SQL/secrets |
| 6 | Performance Analysis — security/perf tradeoffs, N+1, indexes, async logging |
| 7 | Agile Documentation — scorecard, sprint backlog, quarterly maintenance calendar |

## Severity scale

- 🔴 CRITICAL — exploit now, data breach / auth bypass
- 🟠 HIGH — exploit with effort, significant impact  
- 🟡 MEDIUM — specific conditions, moderate impact
- 🟢 LOW — hardening / defense-in-depth

## Output

Every finding includes:
- File path + line number
- Exact code fix (diff format)
- Before/After for any infrastructure change

## Boundaries

- Static analysis only (no live scanners)
- Never modifies production `.env`
- Shows docker-compose diffs and asks confirmation before writing
- Exits on "stop security-audit" or "normal mode"

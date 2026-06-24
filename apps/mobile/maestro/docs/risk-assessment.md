# Risk Assessment — Maestro Automation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Text selectors break on Hindi locale | High | Medium | testIDs; run EN suite in CI first |
| Staging OTP bypass enabled in prod | Low | Critical | Manual security test each release |
| Flaky emulator on CI | Medium | Medium | `continue-on-error` + artifact upload; dedicated device farm later |
| Generated flows too brittle | High | Low | Treat generated/ as draft; promote stable flows to `smoke/` |
| Test accounts suspended | Medium | High | Document account refresh; monitor ACTIVE status |
| Dynamic job list empty | Medium | Medium | Seed `SAMPLE_JOB_ID`; skip apply if no cards |
| APK mismatch with repo | Medium | High | CI downloads APK from EAS build of same commit |
| Maestro version drift | Low | Medium | Pin CLI version in workflow |
| PII in CI secrets | Low | High | Use dedicated test mobiles; rotate; never log env |
| 665 flows runtime too long | High | Low | Default CI runs smoke only; full suite weekly |

---

## Overall automation risk: **Medium**

Maestro is appropriate for this app. Primary risk is **maintaining selectors** until testIDs are widespread.

---

## Go / no-go for CI gating

| Gate | Recommendation |
|------|----------------|
| Block PR on smoke failure | **Yes** — after 2 weeks stabilization |
| Block release on full regression | **No** — until <5% flake rate |
| Nightly full generated suite | **Optional** — informational |

---

## Sign-off checklist (release)

- [ ] Smoke suite pass on staging APK  
- [ ] Worker + Employer E2E pass  
- [ ] Deep link job opens detail  
- [ ] Manual OTP works on production (not 000000)  
- [ ] No crash on cold start (manual or Maestro launch)

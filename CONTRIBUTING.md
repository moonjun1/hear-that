# Branch Strategy

## Branches

- `main` — 프로덕션. Vercel 자동 배포. 직접 push 금지.
- `develop` — 개발 통합 브랜치. feature 완료 시 여기로 PR.
- `feature/*` — 기능 브랜치. 이슈 번호 포함.

## Flow

```
feature/1-nextjs-setup
  ↓ PR
develop
  ↓ PR (Day 마일스톤 완료 시)
main → Vercel 배포
```

## Naming Convention

```
feature/{issue-number}-{short-description}
```

예시:
- `feature/1-nextjs-setup`
- `feature/5-emoji-reaction-bar`
- `feature/11-thunder-wave-animation`

## Commit Message Convention

```
{type}: {description} (#{issue-number})
```

Types: `feat`, `fix`, `chore`, `style`, `refactor`, `docs`, `test`

예시:
- `feat: add emoji reaction bar UI (#5)`
- `fix: rate limit edge case (#6)`
- `chore: update dependencies (#1)`

## PR Rule

- feature → develop: 자유롭게 머지 (squash merge 권장)
- develop → main: Day 마일스톤 완료 시 머지 (일반 merge)

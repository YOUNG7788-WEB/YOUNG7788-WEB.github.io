#!/usr/bin/env bash
set -euo pipefail
repo='YOUNG7788-WEB/YOUNG7788-WEB.github.io'
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
login="$(gh api user --jq .login)"
if [[ "${login,,}" != 'young7788-web' ]]; then
  echo 'Sign in to GitHub CLI as YOUNG7788-WEB before applying these repository settings.' >&2
  exit 1
fi
if [[ "${1:-}" != '--apply' ]]; then
  echo "Prepared settings for ${repo}:"
  cat "$script_dir/main-protection.json"
  echo
  echo 'To apply with your own authorized GitHub administrator session, rerun with --apply.'
  exit 0
fi
# Authentication stays in GitHub CLI; no token, password, or recovery code is read by this script.
gh api --method PUT "repos/${repo}/branches/main/protection" --input "$script_dir/main-protection.json" --jq '{protected: true, force_pushes: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled, administrators_enforced: .enforce_admins.enabled}'
gh api "repos/${repo}/branches/main/protection" --jq '{required_checks: .required_status_checks.checks, force_pushes: .allow_force_pushes.enabled, deletions: .allow_deletions.enabled}'

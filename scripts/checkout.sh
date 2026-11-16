#!/bin/bash
# Usage: npm run checkout -- [--eject] <owner>:<branch> (or <owner>/<branch>)

set -euo pipefail

eject=false
if [[ ${1-} == '--eject' ]]; then eject=true && shift; fi

readonly target=${1:?'missing <owner>:<branch>'}
readonly owner=${target%%[/:]*}
readonly branch=${target#*[/:]}

if [[ $eject == true ]]; then
  if [[ $(git branch --show-current) == "$branch" ]]; then git switch master; fi
  git branch --delete "$branch"
  git for-each-ref --format='%(upstream:remotename)' refs/heads | grep --line-regexp --fixed-strings -- "$owner" >/dev/null || git remote remove "$owner"
  exit 0
fi

git remote get-url "$owner" >/dev/null 2>&1 || git remote add "$owner" "https://github.com/$owner/node-mysql2.git"
git fetch "$owner" "refs/heads/$branch"
git switch --create "$branch" --track "$owner/$branch"

#!/bin/bash
# Usage: npm run checkout -- <owner>/<branch>

set -euo pipefail

readonly target=${1:?'missing <owner>/<branch>'}
readonly owner=${target%%/*}
readonly branch=${target#*/}

git remote get-url "$owner" >/dev/null 2>&1 || git remote add "$owner" "https://github.com/$owner/node-mysql2.git"
git fetch "$owner" "refs/heads/$branch"
git switch --create "$branch" --track "$owner/$branch"

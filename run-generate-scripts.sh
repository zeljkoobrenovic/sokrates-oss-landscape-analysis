cd analysis-scripts/github-repos-finder

node get-repos.js

rm ../generated/clone-scripts/export-pull-requests-*
rm ../generated/analysis-scripts/run-analysis-*
rm ../generated/pull-requests-scripts/clone-and-zip-*

node generate-sh-scripts.js

cd analysis-scripts/github-repos-finder

node get-repos.js
node generate-sh-scripts.js

cd ../generated/clone-scripts
rm clone-and-zip-*
bash run-all.sh
# or run-all-parallel.sh, to run cloning or repos for multiple organization in parallel

cd ../analysis-scripts
rm run-analysis-*
bash run-all.sh

cd ../pull-requests-scripts
rm export-pull-requests-*
bash run-all.sh

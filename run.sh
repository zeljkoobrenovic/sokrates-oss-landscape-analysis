cd analysis-scripts/github-repos-finder

node get-repos.js

rm ../generated/clone-scripts/export-pull-requests-*
rm ../analysis-scripts/run-analysis-*
rm ../pull-requests-scripts/clone-and-zip-*

node generate-sh-scripts.js

cd ../generated/clone-scripts
bash run-all.sh
# or run-all-parallel.sh, to run cloning or repos for multiple organization in parallel

cd ../analysis-scripts
bash run-all.sh

cd ../pull-requests-scripts
bash run-all.sh

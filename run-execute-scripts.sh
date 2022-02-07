cd analysis-scripts/generated/clone-scripts
bash run-all.sh
# or run-all-parallel.sh, to run cloning or repos for multiple organization in parallel

cd ../analysis-scripts
bash run-all.sh

cd ../pull-requests-scripts
bash run-all.sh
cd ../../scripts/github-pulls
node create-index.js
node create-htmls.js

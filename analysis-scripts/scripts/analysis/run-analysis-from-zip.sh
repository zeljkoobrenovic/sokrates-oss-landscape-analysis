# check if we have already analyzed the repository with the same timestamp
TIMESTAMP_FILE=../../../analysis-artifacts/reports/$1/$2/timestamps/last_pushed_$5
REPORT_INDEX_FILE=../../../analysis-artifacts/reports/$1/$2/html/index.html
if [ -f "$REPORT_INDEX_FILE" ]; then
  if [ -f "$TIMESTAMP_FILE" ]; then
      echo "$1 / $2 [$3 snapshot] is already analyzed."
      exit 1
  fi
fi

mkdir ../../../analysis-artifacts
mkdir ../../../analysis-artifacts/reports
mkdir ../../../analysis-artifacts/temp

mkdir ../../../analysis-artifacts/reports/$1

rm -rf ../../../analysis-artifacts/reports/$1/$2
mkdir ../../../analysis-artifacts/reports/$1/$2
mkdir ../../../analysis-artifacts/reports/$1/$2/timestamps

# create a temporary analysis folder
rm -rf ../../../analysis-artifacts/temp/analysis_$1_$2
mkdir ../../../analysis-artifacts/temp/analysis_$1_$2

cp ../../../analysis-scripts/scripts/analysis/sokrates_conventions.json ../../../analysis-artifacts/temp/analysis_$1_$2

cd ../../../analysis-artifacts/temp/analysis_$1_$2

# checkout the code
unzip ../../../analysis-artifacts/archived-repos/$1/$2/repo.zip

# init analysis (skip if the Sokrates config file is provided in the project)
if [ ! -f _sokrates/config.json ]
then
  java -jar $SOKRATES_JAVA_OPTIONS $SOKRATES_JAR_PATH init -conventionsFile ../../../analysis-scripts/scripts/analysis/sokrates_conventions.json -name "$1 / $2" -description "$4" -addLink $3 'GitHub Repo' -logoLink "https://avatars.githubusercontent.com/$1"
fi

# run analysis
java -jar $SOKRATES_JAVA_OPTIONS $SOKRATES_JAR_PATH generateReports -timeout 9999

# Done analysis, now copy data

# copy generated reports to the project reports folder
cp -r _sokrates/reports/* ../../reports/$1/$2

touch ../../reports/$1/$2/timestamps/last_pushed_$5

# remove the temporary analysis folder
cd ..
rm -rf analysis_$1_$2

echo "$(date): $1 / $2" >> ../reports/analysis-log.txt

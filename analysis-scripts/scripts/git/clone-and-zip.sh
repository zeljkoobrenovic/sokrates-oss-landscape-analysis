# check if we have already cloned the repository with the same timestamp
TIMESTAMP_FILE=../../../analysis-artifacts/archived-repos/$1/$2/timestamps/last_pushed_$3
REPO_ZIP_FILE=../../../analysis-artifacts/archived-repos/$1/$2/repo.zip
if [ -f "$REPO_ZIP_FILE" ]; then
  if [ -f "$TIMESTAMP_FILE" ]; then
      echo "$1 / $2 [$3 snapshot] is already cloned."
      exit 1
  fi
fi

mkdir ../../../analysis-artifacts
mkdir ../../../analysis-artifacts/archived-repos
mkdir ../../../analysis-artifacts/archived-repos/$1
rm -rf ../../../analysis-artifacts/archived-repos/$1/$2
mkdir ../../../analysis-artifacts/archived-repos/$1/$2
mkdir ../../../analysis-artifacts/archived-repos/$1/$2/timestamps

cd ../../../analysis-artifacts/archived-repos/$1/$2

echo $1 / $2

# checkout the code
git clone $SOKRATES_GITHUB_URL/$1/$2.git temp_clone_dir

cd temp_clone_dir


# export git history
echo 'Exporting git history...'
# git ls-files -z | xargs -0 -n1 -I{} -- git log --date=short --format="%ad %ae %H {}" {} > git-history.txt
echo "sokrates extractGitHistory"
java -jar $SOKRATES_JAVA_OPTIONS $SOKRATES_JAR_PATH extractGitHistory

rm -rf .git

# remove binaries
find . -type d -name "node_modules" -exec rm -rf {} +
find . -type d -name "_vendor" -exec rm -rf {} +
find . -type d -name "vendor" -exec rm -rf {} +
find . -type d -name "Debug" -exec rm -rf {} +
find . -type d -name "ext_libraries" -exec rm -rf {} +

find . -type f -name "*.zip" -delete
find . -type f -name "*.gz" -delete
find . -type f -name "*.tgz" -delete
find . -type f -name "*.bz2" -delete
find . -type f -name "*.tar" -delete
find . -type f -name "*.z01" -delete
find . -type f -name "*.pkl" -delete
find . -type f -name "*.rar" -delete
find . -type f -name "*.tag" -delete
find . -type f -name "*.7z" -delete
find . -type f -name "*.gz" -delete
find . -type f -name "*.apk" -delete
find . -type f -name "*.aab" -delete
find . -type f -name "*.jar" -delete
find . -type f -name "*.dll" -delete
find . -type f -name "*.exe" -delete
find . -type f -name "*.png" -delete
find . -type f -name "*.jpg" -delete
find . -type f -name "*.jpeg" -delete
find . -type f -name "*.jpe" -delete
find . -type f -name "*.gif" -delete
find . -type f -name "*.pdf" -delete
find . -type f -name "*.rtf" -delete
find . -type f -name "*.doc" -delete
find . -type f -name "*.docx" -delete
find . -type f -name "*.ppt" -delete
find . -type f -name "*.pptx" -delete
find . -type f -name "*.jpi" -delete
find . -type f -name "*.bak" -delete
find . -type f -name "*.woff" -delete
find . -type f -name "*.woff2" -delete
find . -type f -name "*.otf" -delete
find . -type f -name "*.ttf" -delete
find . -type f -name "*.flv" -delete
find . -type f -name "*.swf" -delete
find . -type f -name "*.mp4" -delete
find . -type f -name "*.mp3" -delete
find . -type f -name "*.m4v" -delete
find . -type f -name "*.mov" -delete
find . -type f -name "*.3gp" -delete
find . -type f -name "*.ico" -delete
find . -type f -name "*.cfm" -delete
find . -type f -name "*.db" -delete
find . -type f -name "*.webm" -delete
find . -type f -name "*.eot" -delete
find . -type f -name "*.csv" -delete
find . -type f -name "*.sdf" -delete

zip -r ../repo.zip .

cd ..

rm -rf temp_clone_dir

touch timestamps/last_pushed_$3

echo "$(date): $1 / $2" >> ../../clone-log.txt

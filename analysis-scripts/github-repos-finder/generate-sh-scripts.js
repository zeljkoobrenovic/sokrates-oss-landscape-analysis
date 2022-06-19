const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../config.json'));

const runAnalysisLinePrefix = 'bash ../../scripts/analysis/run-analysis-from-zip.sh ';
const cloneAndDownloadLinePrefix = 'bash ../../scripts/git/clone-and-zip.sh ';
const exportPullRequestsLinePrefix = 'node ../../scripts/github-pulls/get-pulls.js ';

let envVariables = '';

envVariables += 'export SOKRATES_JAR_PATH="' + config.sokratesJarFilePath + '"\n';
envVariables += 'export SOKRATES_GITHUB_URL="' + config.githubCloneUrl + '"\n';
envVariables += 'export SOKRATES_JAVA_OPTIONS="' + config.javaOptions + '"\n';

function getToday() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return yyyy + '-' + mm + '-' + dd;
}

const todayString = getToday();

envVariables += 'export SOKRATES_ANALYSIS_DATE="' + todayString + '"\n';

const cloneScriptsFolder = '../generated/clone-scripts/';
const analysisScriptsFolder = '../generated/analysis-scripts/';
const pullRequestsScriptsFolder = '../generated/pull-requests-scripts/';

if (!fs.existsSync(cloneScriptsFolder)) fs.mkdirSync(cloneScriptsFolder, {recursive: true});
if (!fs.existsSync(analysisScriptsFolder)) fs.mkdirSync(analysisScriptsFolder, {recursive: true});
if (!fs.existsSync(pullRequestsScriptsFolder)) fs.mkdirSync(pullRequestsScriptsFolder, {recursive: true});

let cloneAllScript = '';
let cloneAllScriptParallel = '';
let analyzeAllScript = '';
let runAllPullRequestsScript = '';

const ignoreRepos = [];

function notIgnored(org, repo) {
    let notIgnored = true;

    console.log(org + ' ' + repo.name);

    ignoreRepos.forEach(ignore => {
        if (ignore.org === org && ignore.repo === repo.name) {
            notIgnored = false;
            return;
        }
    })

    return notIgnored;
}

function createAnalysisScripts(org, activeRepos) {
    let runAnalysisScript = envVariables + '\n';
    const analysisScriptFileName = 'run-analysis-' + org + '.sh';
    const scriptPath = analysisScriptsFolder + 'run-analysis-' + org + '.sh';
    console.log(scriptPath);

    activeRepos.forEach(repo => {
        let description = repo.description ? repo.description : " ";
        description = description.replace(/\)/g, "&rpar;");
        description = description.replace(/\(/g, "&lpar;");
        description = description.replace(/\'/g, "&apos;");
        const line = runAnalysisLinePrefix + "'"
            + org + "' '"
            + repo.name + "' '"
            + repo.clone_url + "' '"
            + description + "' '"
            + repo.pushed_at + "'";
        runAnalysisScript += line + "\n";
        fs.writeFileSync(scriptPath, runAnalysisScript + '\n' +
            'cd ../../../analysis-artifacts/reports/' + org + '\n' +
            'java -jar $SOKRATES_JAVA_OPTIONS $SOKRATES_JAR_PATH updateLandscape\n');
    });

    analyzeAllScript += 'bash ' + analysisScriptFileName + '\n';
    fs.writeFileSync(analysisScriptsFolder + 'run-all.sh', analyzeAllScript);
}

function createCloneAndZipScripts(org, activeRepos) {
    let cloneAndZipScript = envVariables + '\n';

    const cloneScriptFileName = 'clone-and-zip-' + org + '.sh';
    const scriptPath = cloneScriptsFolder + 'clone-and-zip-' + org + '.sh';
    console.log(scriptPath);

    activeRepos.forEach(repo => {
        const line = cloneAndDownloadLinePrefix + "'" + org + "' '" + repo.name + "' '" + repo.pushed_at + "'";
        cloneAndZipScript += line + "\n";
        fs.writeFileSync(scriptPath, cloneAndZipScript);
    });

    cloneAllScript += 'bash ' + cloneScriptFileName + '\n';
    cloneAllScriptParallel += 'bash ' + cloneScriptFileName + ' &\n';
    fs.writeFileSync(cloneScriptsFolder + 'run-all.sh', cloneAllScript);
    fs.writeFileSync(cloneScriptsFolder + 'run-all-parallel.sh', cloneAllScriptParallel);
}

function createExportPullRequestsScripts(org, activeRepos) {
    let script = envVariables + '\n';

    const fileName = 'export-pull-requests-' + org + '.sh';
    const scriptPath = pullRequestsScriptsFolder + 'export-pull-requests-' + org + '.sh';
    console.log(scriptPath);

    activeRepos.forEach(repo => {
        const line = exportPullRequestsLinePrefix + "'" + org + "' '" + repo.name + "'";
        script += line + "\n";
        fs.writeFileSync(scriptPath, script);
    });

    runAllPullRequestsScript += 'bash ' + fileName + '\n';
    fs.writeFileSync(pullRequestsScriptsFolder + 'run-all.sh', runAllPullRequestsScript);
}

const createScripts = function (org) {
    const reposFile = '../generated/data/config-repos/' + org + "-active.json";
    if (!fs.existsSync(reposFile)) {
        console.log(reposFile + ' does not exist.');
        return;
    }
    const activeRepos = JSON.parse(fs.readFileSync(reposFile, 'utf8'))
        .filter(repo => notIgnored(org, repo));

    createExportPullRequestsScripts(org, activeRepos);
    createCloneAndZipScripts(org, activeRepos);
    createAnalysisScripts(org, activeRepos);
}

const orgs = config.githubOrgs;

orgs.forEach(org => createScripts(org));

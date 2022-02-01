const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../config.json'));

const runAnalysisLinePrefix = 'bash ../../scripts/analysis/run-analysis-from-zip.sh ';
const cloneAndDownloadLinePrefix = 'bash ../../scripts/git/clone-and-zip.sh ';
const exportPullRequestsLinePrefix = 'node ../../scripts/config-pulls/get-pulls.js ';

let envVariables = '';

envVariables += 'export SOKRATES_JAR="' + config.sokratesJarFilePath + '"\n';
envVariables += 'export GITHUB_URL="' + config.githubCloneUrl + '"\n';

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
        fs.writeFileSync(analysisScriptsFolder + 'run-analysis-' + org + ".sh", runAnalysisScript + '\n' +
            'cd ../../../analysis-artifacts/reports/' + org + '\n' +
            'java -jar $SOKRATES_JAR -Xmx28g updateLandscape\n' );
        console.log('analysis-scripts/' + repo.name);
    });
    analyzeAllScript += 'bash ' + analysisScriptFileName + '\n';
    fs.writeFileSync(analysisScriptsFolder + 'run-all.sh', analyzeAllScript);
}

function createCloneAndZipScripts(org, activeRepos) {
    let cloneAndZipScript = envVariables + '\n';

    const cloneScriptFileName = 'clone-and-zip-' + org + '.sh';
    activeRepos.forEach(repo => {
        const line = cloneAndDownloadLinePrefix + "'" + org + "' '" + repo.name + "' '" + repo.pushed_at + "'";
        cloneAndZipScript += line + "\n";
        fs.writeFileSync(cloneScriptsFolder + 'clone-and-zip-' + org + ".sh", cloneAndZipScript);
        console.log('clone-scripts/' + repo.name);
    });
    cloneAllScript += 'bash ' + cloneScriptFileName + '\n';
    cloneAllScriptParallel += 'bash ' + cloneScriptFileName + ' &\n';
    fs.writeFileSync(cloneScriptsFolder + 'run-all.sh', cloneAllScript);
    fs.writeFileSync(cloneScriptsFolder + 'run-all-parallel.sh', cloneAllScriptParallel);
}

function createExportPullRequestsScripts(org, activeRepos) {
    let script = envVariables + '\n';

    const fileName = 'export-pull-requests-' + org + '.sh';
    activeRepos.forEach(repo => {
        const line = exportPullRequestsLinePrefix + "'" + org + "' '" + repo.name + "'";
        script += line + "\n";
        fs.writeFileSync(pullRequestsScriptsFolder + 'export-pull-requests-' + org + ".sh", script);
        console.log('pull-requests/' + repo.name);
    });
    runAllPullRequestsScript += 'bash ' + fileName + '\n';
    fs.writeFileSync(pullRequestsScriptsFolder + 'run-all.sh', runAllPullRequestsScript);
}

const createScripts = function (org) {
    const reposFile = '../generated/data/config-repos/' + org + "-active.json";
    if (!fs.existsSync(reposFile)) {
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

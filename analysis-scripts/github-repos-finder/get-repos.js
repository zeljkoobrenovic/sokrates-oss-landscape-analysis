const https = require('https');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../config.json'));

const gitRepoPrefix = config.githubApiUrl + '/orgs/';
const startDate = config.reposUpdatedAfter;
const token = 'token ' + config.githubToken;

const headers = {headers: {'user-agent': 'node.js', 'Authorization': token}};

let reposCount = 0;
let reposCountActive = 0;

const saveRepositories = function (org, next) {
    let repos = [];
    const download = function (page) {
        const url = gitRepoPrefix + org + '/repos?per_page=100&page=' + page;
        console.log(url);
        https.get(url, headers, function (response) {
            console.log('rate limit: ' + response.headers['x-ratelimit-limit'] + ' API calls, ' +
                'remaining ' + response.headers['x-ratelimit-remaining'] + ' calls');
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                const reposPage = JSON.parse(data);
                if (reposPage.length > 0) {
                    console.log(reposPage.length);
                    repos = repos.concat(reposPage);
                    console.log(repos.length);

                    const githubRepoDataFolder = '../generated/data/config-repos/';
                    if (!fs.existsSync(githubRepoDataFolder)) fs.mkdirSync(githubRepoDataFolder, {recursive: true});
                    fs.writeFileSync(githubRepoDataFolder + org + '-raw.json', JSON.stringify(repos, null, 2));
                    let mappedData = repos.map(repo => {
                        return {
                            name: repo.name,
                            description: repo.description,
                            html_url: repo.html_url,
                            clone_url: repo.clone_url,
                            size: repo.size,
                            archived: repo.archived,
                            language: repo.language,
                            created_at: repo.created_at,
                            updated_at: repo.updated_at,
                            pushed_at: repo.pushed_at,
                            watchers: repo.watchers
                        }
                    });
                    fs.writeFileSync(githubRepoDataFolder + org + '.json', JSON.stringify(mappedData, null, 2));

                    let activeData = mappedData
                        .filter(repo => repo.language !== null)
                        .filter(repo => !repo.archived)
                        .filter(repo => repo.pushed_at >= startDate);
                    fs.writeFileSync(githubRepoDataFolder + org + '-active.json', JSON.stringify(activeData, null, 2));

                    reposCount += reposPage.length;
                    reposCountActive += reposPage
                        .filter(repo => repo.language !== null)
                        .filter(repo => !repo.archived)
                        .filter(repo => repo.pushed_at >= startDate).length;

                    download(page + 1);
                } else {
                    next();
                }
            });
        });
    }
    download(1);
}

const orgs = config.githubOrgs;

const callProcessing = function () {
    if (orgs.length > 0) {
        saveRepositories(orgs.pop(), () => {
            callProcessing();
        });
    }
    console.log('\nFound ' + reposCount + ' repositories, ' + reposCountActive + ' updated after ' + startDate + '.');
}

callProcessing();


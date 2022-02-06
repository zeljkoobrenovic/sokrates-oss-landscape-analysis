const https = require('https');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('../../config.json'));

const token = 'token ' + config.githubToken;
const headers = {headers: {'user-agent': 'node.js', 'Authorization': token}};

const gitRepoPrefix = config.githubApiUrl + '/';

function processPullRequestIndex(object, numbersMap, pulls, org, repo, save, download, page) {
    if (object && object.length && object.length > 0) {
        object.forEach(pullRequest => {
            if (pullRequest.created_at > config.pullsCreatedAfter) {
                if (numbersMap[pullRequest.number] === undefined) {
                    numbersMap[pullRequest.number] = pullRequest.number;
                    const pullRequestObject = {
                        title: pullRequest.title,
                        state: pullRequest.state,
                        number: pullRequest.number,
                        html_url: pullRequest.html_url,
                        created_at: pullRequest.created_at,
                        updated_at: pullRequest.updated_at,
                        closed_at: pullRequest.closed_at,
                        merged_at: pullRequest.merged_at,
                        org_avatar_url: pullRequest.head.repo ? pullRequest.head.repo.owner.avatar_url : null,
                        user: {
                            login: pullRequest.user.login,
                            html_url: pullRequest.user.html_url,
                            avatar_url: pullRequest.user.avatar_url,
                            type: pullRequest.user.type,
                        },
                        reviews: []
                    };
                    pulls.push(pullRequestObject);
                }
            }
        });
        console.log(object.length);
        console.log(pulls.length);
        save(org, repo);
        download(org, repo, page + 1);
    }
}

function processReviews(object, pullRequestObject, org, repo) {
    if (object && object.length && object.length > 0) {
        object.forEach(review => {
            pullRequestObject.reviews.push({
                body: review.body,
                state: review.state,
                submitted_at: review.submitted_at,
                html_url: review.html_url,
                user: {
                    login: review.user.login,
                    html_url: review.user.html_url,
                    avatar_url: review.user.avatar_url,
                    type: review.user.type,
                }
            });
        });
    }
}

let pulls = [];
const numbersMap = {};

function save(org, repo) {
    const orgFolder = '../../../analysis-artifacts/pull-requests/' + org;
    if (!fs.existsSync(orgFolder)) fs.mkdirSync(orgFolder, {recursive: true});
    const folder = orgFolder + '/' + repo;
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true});
    fs.writeFileSync(folder + '/git-pull-requests.json', JSON.stringify(pulls, null, 2));
}

const download = function (org, repo, page) {
    const url = gitRepoPrefix + 'repos/' + org + '/' + repo + '/pulls?per_page=100&state=all&page=' + page;
    console.log(url);

    https.get(url, headers, function (response) {
	        console.log('GitHub API rate limit: ' + JSON.stringify(response.headers['x-ratelimit-limit']) +
                ',  remaining: ' + JSON.stringify(response.headers['x-ratelimit-remaining']));
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                let object = JSON.parse(data);
                processPullRequestIndex(object, numbersMap, pulls, org, repo, save, download, page);
            });
    });
}

setTimeout(() => download(process.argv[2], process.argv[3], 1), 3000);




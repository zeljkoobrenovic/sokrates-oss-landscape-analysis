var fs = require('fs');
var path = require('path');

const root = '../../../analysis-artifacts/pull-requests';

const average = function (array, length) {
    if (length && array.length > length) {
        array = array.slice(0, length);
    }
    return Math.round(array.reduce((a, b) => parseInt(a + '', 10) + parseInt(b + '', 10)) / array.length);
}

const stdev = function (array) {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.round(Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n));
}

const formatDate = function (date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

function walk(directory, filepaths = []) {
    const files = fs.readdirSync(directory);
    for (let filename of files) {
        const filepath = path.join(directory, filename);
        if (fs.statSync(filepath).isDirectory()) {
            walk(filepath, filepaths);
        } else if (filename === 'git-pull-requests.json') {
            const elements = directory.split('/');
            let pullRequest = {
                org: elements[elements.length - 2],
                repo: elements[elements.length - 1],
                path: filepath,
                openPerWeek: [],
                mergedPerWeek: [],
                closedPerWeek: [],
                weekInfo: []
            };
            filepaths.push(pullRequest);

            const data = JSON.parse(fs.readFileSync(filepath)).sort((a, b) => (a.created_at > b.created_at) ? 1 : ((b.created_at > a.created_at) ? -1 : 0));
            const dataMerged = data.filter(d => d.merged_at);

            const date = new Date();

            let countOpen = 0;
            let countMerge = 0;
            let countClosed = 0;
            for (let i = 0; i < 104; i++) {
                date.setDate(date.getDate() - 7);
                let formattedDate = formatDate(date);

                const openAfterDate = data.filter(d => d.created_at >= formattedDate).length;
                const mergedAfterDate = dataMerged.filter(d => d.merged_at >= formattedDate).length;
                const closedAfterDate = data.filter(d => !d.merged_at && d.closed_at >= formattedDate).length;

                pullRequest.openPerWeek.push(openAfterDate - countOpen);
                pullRequest.mergedPerWeek.push(mergedAfterDate - countMerge);
                pullRequest.closedPerWeek.push(closedAfterDate - countClosed);
                pullRequest.weekInfo.push({
                    year: date.getUTCFullYear(),
                    month: date.getUTCMonth() + 1,
                    day: date.getDate()
                });

                countOpen = openAfterDate;
                countMerge = mergedAfterDate;
                countClosed = closedAfterDate;
            }

            if (data.length > 0) {
                pullRequest.pullRequestsCount = data.length;
                pullRequest.pullRequestsWithReviewsCount = data.filter(pr => pr.reviews.length > 0).length;
                pullRequest.openRequestsCount = data.filter(pr => pr.state !== 'closed').length;
                pullRequest.mergedRequestsCount = dataMerged.length;
                pullRequest.firstPullRequest = data.filter(pr => pr.reviews.length > 0).length;
                pullRequest.firstPullRequest = data[0].created_at;
                pullRequest.latestPullRequest = data[data.length - 1].created_at;
                pullRequest.org_avatar_url = data[0].org_avatar_url;

                pullRequest.openAverage = average(pullRequest.openPerWeek);
                pullRequest.openStDev = stdev(pullRequest.openPerWeek);
                pullRequest.openAverage12Weeks = average(pullRequest.openPerWeek, 12);

                pullRequest.mergedAverage = average(pullRequest.mergedPerWeek);
                pullRequest.mergedStDev = stdev(pullRequest.mergedPerWeek);
                pullRequest.mergedAverage12Weeks = average(pullRequest.mergedPerWeek, 12);

                pullRequest.closedAverage = average(pullRequest.closedPerWeek);
                pullRequest.closedStDev = stdev(pullRequest.closedPerWeek);
                pullRequest.closedAverage12Weeks = average(pullRequest.closedPerWeek, 12);
            }
        }
    }
    return filepaths;
}

const repos = walk(root);

const orgs = [];
const orgsMap = {};

repos.forEach(repo => {
    const org = repo.org;
    if (!orgsMap[org]) {
        orgsMap[org] = {
            org: repo.org,
            avatar_url: repo.org_avatar_url,
            reposCount: 1,
            pullRequestsCount: repo.pullRequestsCount,
            pullRequestsWithReviewsCount: repo.pullRequestsWithReviewsCount,
            openRequestsCount: repo.openRequestsCount,
            openAverage: repo.openAverage,
            closedAverage: repo.closedAverage,
            mergedAverage: repo.mergedAverage,
            openAverage12Weeks: repo.openAverage12Weeks,
            closedAverage12Weeks: repo.closedAverage12Weeks,
            mergedAverage12Weeks: repo.mergedAverage12Weeks,
            openPerWeek: [...repo.openPerWeek],
            mergedPerWeek: [...repo.mergedPerWeek],
            mergedPerWeekProjectCount: [...repo.mergedPerWeek.map(m => m > 0 ? 1 : 0)],
            weekInfo: [...repo.weekInfo],
            closedPerWeek: [...repo.closedPerWeek],
        };
        orgs.push(orgsMap[org]);
    } else {
        orgsMap[org].reposCount += 1;
        orgsMap[org].pullRequestsCount += repo.pullRequestsCount;
        orgsMap[org].pullRequestsWithReviewsCount += repo.pullRequestsWithReviewsCount;
        orgsMap[org].openRequestsCount += repo.openRequestsCount;

        for (let i = 0; i < repo.openPerWeek.length; i++) {
            orgsMap[org].openPerWeek[i] += repo.openPerWeek[i];
            orgsMap[org].mergedPerWeek[i] += repo.mergedPerWeek[i];
            orgsMap[org].mergedPerWeekProjectCount[i] += repo.mergedPerWeek[i] > 0 ? 1 : 0;
            orgsMap[org].closedPerWeek[i] += repo.closedPerWeek[i];
        }
        orgsMap[org].openAverage = average(orgsMap[org].openPerWeek, 0);
        orgsMap[org].mergedAverage = average(orgsMap[org].mergedPerWeek, 0);
        orgsMap[org].closedAverage = average(orgsMap[org].closedPerWeek, 0);
        orgsMap[org].openAverage12Weeks = average(orgsMap[org].openPerWeek, 12);
        orgsMap[org].mergedAverage12Weeks = average(orgsMap[org].mergedPerWeek, 12);
        orgsMap[org].mergedAverageProjectCount12Weeks = average(orgsMap[org].mergedPerWeekProjectCount, 12);
        orgsMap[org].closedAverage12Weeks = average(orgsMap[org].closedPerWeek, 12);
    }
});

fs.writeFileSync(root + '/index.json', JSON.stringify({
    orgs: orgs,
    repos: repos
}, null, 2));

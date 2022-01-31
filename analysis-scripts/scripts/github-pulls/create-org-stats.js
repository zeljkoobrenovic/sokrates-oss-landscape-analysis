const fs = require('fs');
const path = require('path');

function analyze(root, suffix, startDate) {
    const creators = [];
    const creatorsMap = {};

    function isNotBot(login) {
        return !login.toLowerCase().includes("githubbot") && !login.toLowerCase().includes("[bot]");
    }

    function processCreators(data) {
        data.forEach(request => {
            const user = request.user;
            const login = user.login;
            if (isNotBot(login)) {
                if (creatorsMap[login]) {
                    creatorsMap[login].pullRequestsCount += 1;
                } else {
                    creatorsMap[login] = {
                        login: login,
                        html_url: user.html_url,
                        avatar_url: user.avatar_url,
                        pullRequestsCount: 1
                    };
                    creators.push(creatorsMap[login]);
                }
            }
        });
    }

    function walk(directory) {
        const files = fs.readdirSync(directory);
        for (let filename of files) {
            const filepath = path.join(directory, filename);
            if (fs.statSync(filepath).isDirectory()) {
                walk(filepath);
            } else if (filename === 'git-pull-requests.json') {
                let data = JSON.parse(fs.readFileSync(filepath)).sort((a, b) => (a.created_at > b.created_at) ? 1 : ((b.created_at > a.created_at) ? -1 : 0));
                console.log(filepath);
                console.log('    ' + suffix);
                console.log('    ' + startDate);
                console.log('    ' + data.length);
                data = data.filter(request => request.created_at.substr(0, 10) > startDate);
                console.log('    ' + data.length);
                processCreators(data);
            }
        }
    }

    walk(root, []);

    fs.writeFileSync(root + '/stats' + suffix + '.json', JSON.stringify({
        creators: creators.sort((a, b) => b.pullRequestsCount - a.pullRequestsCount),
        reviewers: []
    }, null, 2));

    fs.writeFileSync(root + '/data_creators' + suffix + '.txt',
        creators.sort((a, b) => b.pullRequestsCount - a.pullRequestsCount)
            .map(c => c.login + '\t' + c.html_url + '\t' + c.pullRequestsCount).join('\n'));
}

function analyzeOrg(org) {
    const prRoot = '../../target/pull-requests/' + org;

    analyze(prRoot, '_30_days', '2020-12-24');
    analyze(prRoot, '_90_days', '2020-10-24');
    analyze(prRoot, '_6_months', '2020-07-24');
    analyze(prRoot, '_1_year', '2020-01-24');
    analyze(prRoot, '_all_time', '1900-01-01');
}

analyzeOrg('facebook');
analyzeOrg('BoltsFramework');
analyzeOrg('facebook');
analyzeOrg('facebookexperimental');
analyzeOrg('facebookincubator');
analyzeOrg('facebookresearch');
analyzeOrg('fbdevelopercircles');
analyzeOrg('fbsamples');
analyzeOrg('flashlight');
analyzeOrg('flowtype');
analyzeOrg('hhvm');
analyzeOrg('instagram');
analyzeOrg('mapillary');
analyzeOrg('novifinancial');
analyzeOrg('pytorch');
analyzeOrg('reactjs');
analyzeOrg('relayjs');
analyzeOrg('torchcraft');
analyzeOrg('whatsapp');
analyzeOrg('wit-ai');

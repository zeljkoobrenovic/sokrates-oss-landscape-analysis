var fs = require('fs');

const colorOpen = '#2da44e';
const colorClosed = '#cf222e';
const colorMerged = '#8250df';

const root = '../../../analysis-artifacts/pull-requests';
const htmlRoot = root + '/_html';

if (!fs.existsSync(htmlRoot)) fs.mkdirSync(htmlRoot, {recursive: true});

const index = JSON.parse(fs.readFileSync(root + '/index.json'));

const htmlPrefix = '<html>\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Ubuntu">\n' +
    '  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato">\n' +
    '  <style type="text/css" media="all">\n' +
    '    body {\n' +
    '      font-family: Roboto, Vollkorn, Ubuntu, Optima, Segoe, Segoe UI, Candara, Calibri, Arial, sans-serif;\n' +
    '    }\n' +
    '    table {\n' +
    '      color: #333;\n' +
    '      border-collapse: collapse;\n' +
    '      border-spacing: 0;\n' +
    '    }\n' +
    '    td, th {\n' +
    '      border: 1px solid #CCC;\n' +
    '      height: 30px;\n' +
    '      padding-left: 10px;\n' +
    '      padding-right: 10px;\n' +
    '    }\n' +
    '    th {\n' +
    '      background: #F3F3F3;\n' +
    '      font-weight: bold;\n' +
    '    }\n' +
    '    ul {\n' +
    '      padding-left: 20px;\n' +
    '    }\n' +
    '    td {\n' +
    '      background: #FFFFFF;\n' +
    '      text-align: center;\n' +
    '      border: none;\n' +
    '    }\n' +
    '    h3 {\n' +
    '      margin-top: 0\n' +
    '    }\n' +
    '    h1 {\n' +
    '      margin-bottom: 6px;\n' +
    '    }\n' +
    '    p {\n' +
    '      margin-top: 0;\n' +
    '    }\n' +
    '    a {\n' +
    '      text-decoration: none;\n' +
    '    }\n' +
    '  </style>\n' +
    '  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-129891352-1"></script>\n' +
    ' <script>\n' +
    '  window.dataLayer = window.dataLayer || [];\n' +
    '  function gtag() {\n' +
    '   dataLayer.push(arguments);\n' +
    '  }\n' +
    '  gtag(\'js\', new Date());\n' +
    '  gtag(\'config\', \'UA-129891352-1\');\n' +
    ' </script>\n'
'</head>\n<body>\n';

function addZeroIfNeeded(number) {
    return (number < 10 ? '0' : '') + number + '';
}

function addBar(index, count, max, week, color) {
    max = Math.max(count, max);
    max = Math.max(1, max);
    const opacity = index < 12 ? 1.0 : 0.6;
    const title = count + ' in the week of ' + week.year + '-' + addZeroIfNeeded(week.month) + '-' + addZeroIfNeeded(week.day);
    return count > 0
        ? (
            "<div style='width: 10px; background-color: " + color + "; opacity: " + opacity +
            "; height: " +
            (Math.max(1, Math.round(80 * count / max))) + "px' " +
            "title='" + title + "'></div>")
        : "";
}

function addSummaryBar(index, count, max, week, color) {
    max = Math.max(count, max);
    max = Math.max(1, max);
    const opacity = index < 12 ? 1.0 : 0.6;
    const title = 'week of ' + week.year + '-' + addZeroIfNeeded(week.month) + '-' + addZeroIfNeeded(week.day);
    return count > 0
        ? ("<div style='width: 13px; background-color: " + color + "; opacity: " + opacity +
            "; height: " + Math.max(1, Math.round(120 * count / max)) + "px' " +
            "title='" + title + "'></div>")
        : "";
}

function addAverageBar(repo) {
    if (repo.mergedAverage12Weeks === undefined) return "";
    return "<div style='width: 12px;'>" + repo.mergedAverage12Weeks + "</div>" +
        "<div style='width: 12px; background-color: lightgrey; height: " + repo.mergedAverage12Weeks + "px'></div>";
}

function addAvatarImage(repo) {
    return "<img target='_blank' src='https://avatars.githubusercontent.com/" + repo.org + "' style='width: 42px;'>";
}

function average12Weeks(array, start) {
    let total = 0;
    let limit = Math.min(start + 12, array.length);

    for (let i = start; i < limit; i++) {
        total += array[i];
    }

    const windowSize = limit - start;
    let average = Math.round(total / windowSize);
    return windowSize > 0 ? (average === 0 && total > 0 ? 1 : average) : 0;
}

function repoLink(repo) {
    let text = repo.repo;
    if (text.length > 20) {
        text = text.substr(0, 20) + '...';
    }
    return "<a title='" + (repo.org + '/' + repo.repo) + "' target='_blank' href='https://github.com/" + (repo.org + "/" + repo.repo) + "'>" +
        "<div style='font-size: 70%'>" + repo.org + "</div><div>" + text + "</div></a>";
}

function card(value, color, label) {
    return '<div style="color: white; background-color: ' + color + '; height: 120px; width: 120px; border-radius: 5px;">' +
        '<div style="color: lightgrey; padding-top: 12px; font-size: 80%">' + label + '</div>' +
        '<div style="padding-top: 10px; font-size: 230%">' + value + '</div>' +
        '<div style="color: lightgrey; padding-top: 4px; font-size: 80%">per week</div>' +
        '<div style="color: lightgrey; padding-top: 2px; font-size: 50%">(12 weeks average)</div>' +
        '</div>';
}

function smallCard(value, color) {
    return '<div style="color: white; background-color: ' + color + '; border-radius: 3px;" ' +
        'title="per week (average of past 12 weeks)">' +
        '<div style="padding: 4px; font-size: 230%">' + value + '</div>' +
        '</div>';
}

function maxRequestOfOrg(org) {
    const maxMerged = org.mergedPerWeek.reduce((a, b) => Math.max(a, b));
    const maxClosed = org.closedPerWeek.reduce((a, b) => Math.max(a, b));

    return Math.max(maxMerged, maxClosed);
}

function maxRequestOfRepos(repos) {
    let max = 0;

    repos.forEach(repo => {
        const maxMerged = repo.mergedPerWeek.reduce((a, b) => Math.max(a, b));
        const maxClosed = repo.closedPerWeek.reduce((a, b) => Math.max(a, b));

        max = Math.max(max, Math.max(maxMerged, maxClosed));
    });

    return max;
}

const bigOrg = [];

function createOrgHTML(org, addAllRepos) {
    const max = maxRequestOfOrg(org);
    let html = htmlPrefix;
    html += "<table>\n";
    html += "<tr>\n";
    html += "<td></td>";
    html += "<td colspan='52' style='padding-left: 5px; padding-right: 0; padding-bottom: 0; padding-top: 0; text-align: left; font-size: 70%; color: lightgrey'>" +
        "LATEST <-- pull requests per week (average over 12 weeks)</td>";
    html += "</tr>\n";
    html += "<tr>\n";
    html += "<td>" + card(average12Weeks(org.mergedPerWeek, 0), colorMerged, 'merged') + "</td>\n";
    for (let i = 0; i < org.mergedPerWeek.length; i++) {
        html += "<td style='padding: 0; padding-right: 1px; vertical-align: bottom; font-size: 40%'>" + addSummaryBar(i, average12Weeks(org.mergedPerWeek, i), max, org.weekInfo[i], colorMerged) + "</td>\n";
    }
    html += "</tr>\n";
    html += "<tr>\n";
    html += "<td>" + card(average12Weeks(org.closedPerWeek, 0), colorClosed, 'closed') + "</td>\n";
    for (let i = 0; i < org.closedPerWeek.length; i++) {
        html += "<td style='padding: 0; padding-right: 1px; vertical-align: top; font-size: 40%'>" + addSummaryBar(i, average12Weeks(org.closedPerWeek, i), max, org.weekInfo[i], colorClosed) + "</td>\n";
    }
    html += "</tr>\n";
    html += "</table>\n";

    html += "<table style='margin-top: 20px'>\n";

    let preparedList = index.repos
        .filter(repo => addAllRepos || repo.org === org.org)
        .filter(repo => repo.mergedPerWeek.reduce((x, y) => x + y) > 0)
        .sort((a, b) => (b.openPerWeek.reduce((x, y) => x + y)) - (a.openPerWeek.reduce((x, y) => x + y)))
        .sort((a, b) => (b.openAverage12Weeks ? b.openAverage12Weeks : 0) - (a.openAverage12Weeks ? a.openAverage12Weeks : 0));

    html += "<tr>\n";
    html += "<td style='padding-right: 0; padding-bottom: 0; padding-top: 0; text-align: center; font-size: 70%; color: grey'>" + preparedList.length + "</td>";
    html += "<td style='padding-right: 0; padding-bottom: 0; padding-top: 0; text-align: left; font-size: 70%; color: grey'>repository</td>";
    html += "<td></td>";
    html += "<td colspan='52' style='padding-left: 5px; padding-right: 0; padding-bottom: 0; padding-top: 0; text-align: left; font-size: 70%; color: lightgrey'>" +
        "LATEST <-- merged pull requests per week (average over 12 weeks)</td>";
    html += "</tr>\n";

    const maxRepo = maxRequestOfRepos(preparedList);


    preparedList.forEach(repo => {
        html += "<tr>\n";
        html += "<td style='padding-right: 0'>" + addAvatarImage(repo) + "</td>\n";
        html += "<td style='text-align: left; max-width: 300px; overflow: hidden'>" + repoLink(repo) + "</td>\n";
        html += "<td style='text-align: center; vertical-align: bottom; font-size: 50%; padding: 0; width: 12px;'>" + smallCard(average12Weeks(repo.mergedPerWeek, 0), colorMerged) + "</td>\n";
        html += "<td style='padding: 2px;'></td>\n";

        for (let i = 0; i < repo.mergedPerWeek.length; i++) {
            html += "<td style='vertical-align: bottom; font-size: 40%; padding: 0'>" + addBar(i, average12Weeks(repo.mergedPerWeek, i), maxRepo, repo.weekInfo[i], colorMerged) + "</td>\n";
        }
        html += "</tr>\n";
        html += "<tr>\n";
        html += "<td style='padding-right: 0'></td>\n";
        html += "<td style='text-align: left'></td>\n";
        html += "<td style='text-align: center; vertical-align: top; font-size: 50%; padding: 0; width: 12px; padding-top: 1px;'>" +
            smallCard(average12Weeks(repo.closedPerWeek, 0), colorClosed) +
            "</td>\n";
        html += "<td style='padding: 2px;'></td>\n";

        for (let i = 0; i < repo.closedPerWeek.length; i++) {
            html += "<td style='vertical-align: top; font-size: 40%; padding: 0; padding-right: 1px; padding-top: 1px;'>" + addBar(i, average12Weeks(repo.closedPerWeek, i), maxRepo, repo.weekInfo[i], colorClosed) + "</td>\n";
        }
        html += "</tr>\n";
    });
    html += "</table>\n";

    html += '\n</body>\n</html>';

    fs.writeFileSync(htmlRoot + '/' + (addAllRepos ? 'index' : org.org) + '.html', html);
}

index.orgs.forEach(org => {
    createOrgHTML(org, false);
});

if (index.orgs.length > 1) {
    const bigOrg = JSON.parse(JSON.stringify(index.orgs[0]));

    for (let i = 0; i < bigOrg.openPerWeek.length; i++) {
        bigOrg.openPerWeek[i] = 0;
        bigOrg.mergedPerWeek[i] = 0;
        bigOrg.closedPerWeek[i] = 0;
    }

    index.orgs.forEach(org => {
        for (let i = 0; i < bigOrg.openPerWeek.length; i++) {
            bigOrg.openPerWeek[i] += org.openPerWeek[i];
            bigOrg.mergedPerWeek[i] += org.mergedPerWeek[i];
            bigOrg.closedPerWeek[i] += org.closedPerWeek[i];
        }
    });

    createOrgHTML(bigOrg, true);
}


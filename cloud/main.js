function rateMatch(offset, clapDiff, fileDiff) {
    let localClapDiff = clapDiff.map(function (x) { return x + offset; });
    let localFileDiff = fileDiff.slice();
    let hits = 0;
    let goodHits = 0;
    let next = -1;
    let possibleFutureHits = clapDiff.length;
    let matches = [];
    let clapID = 0;
    let fileID = 0;
    for (let i of localClapDiff) {
        clapID++;
        if (fileDiff[fileDiff.length - 1][1] < i) {
            possibleFutureHits -= 1;
            continue;
        }
        for (let j of localFileDiff.slice()) {
            fileID++;
            if (j[0] > i) {
                break;
            }
            localFileDiff.splice(localFileDiff.indexOf(j), 1);
            if (j[0] <= i && j[1] >= i) {
                matches.push([clapID, fileID]);
                hits++;
                let percentagePlace = (i - j[0]) / (j[1] - j[0]) * 100;
                if (percentagePlace < 40) {
                    goodHits++;
                }
                break;
            }
        }
    }
    //findNext
    localFileDiff = fileDiff.slice();
    for (let i of localClapDiff) {
        for (let j of localFileDiff.slice()) {
            if (i < j[0] && (j[0] - i < next || next === -1)) {
                next = j[0] - i;
                localFileDiff.splice(localFileDiff.indexOf(j), 1);
            }
        }
    }
    return [hits, goodHits, next, possibleFutureHits, matches];
}
function match(clapDiff, fileDiff) {
    let currentOffset = 0;
    let bestHits = [-1, -1, -1, -1, [[-1, -1]]];
    while (true) {
        let tmpMatch = rateMatch(currentOffset, clapDiff, fileDiff);
        if (tmpMatch[0] > bestHits[0]) {
            bestHits = tmpMatch;
        }
        else if (tmpMatch[0] === bestHits[0] && tmpMatch[1] > bestHits[1]) {
            bestHits = tmpMatch;
        }
        if (tmpMatch[2] === -1) {
            break;
        }
        if (bestHits[0] > tmpMatch[3]) {
            break;
        }
        currentOffset += tmpMatch[2];
    }
    return [bestHits, currentOffset];
}
function getDifferences(times) {
    if (times.length === 0) {
        return null;
    }
    if (times[0] instanceof Array) {
        let initialTime = times[0][0];
        let returnTimes = [];
        returnTimes.push([0, times[0][1] - initialTime]);
        for (let i of times) {
            returnTimes.push([(i[0] - initialTime), (i[1] - initialTime)]);
        }
        return returnTimes;
    }
    else {
        let initialTime = times[0];
        let returnTimes = [];
        for (let i of times) {
            returnTimes.push(i - initialTime);
        }
        return returnTimes;
    }
}
function processTimes(clapTimes, fileInfo) {
    fileInfo = fileInfo.sort((n1, n2) => n1[0] - n2[0]);
    let fileTimes = fileInfo.map(function (x) { return [x[0], x[0] + x[1]]; });
    let clapDifferences = getDifferences(clapTimes);
    let fileDifferences = getDifferences(fileTimes);
    let result = match(clapDifferences, fileDifferences);
    clapDifferences = clapDifferences.map(function (x) { return x + result[1]; });
    let fileIDs = fileInfo.map(function (x) { return x[2]; });
    return result;
}
Parse.Cloud.define("processTimes", function (request, response) {
    let testClapTimes = [1469596205, 1469596221, 1469596234];
    let requestFileInfo = request["data"];
    console.log(requestFileInfo);
    let result = processTimes(testClapTimes, requestFileInfo);
    response.success(result);
});
//# sourceMappingURL=app.js.map
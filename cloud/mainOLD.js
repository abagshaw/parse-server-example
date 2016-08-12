var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
function rateMatch(offset, clapDiff, fileDiff) {
    let localClapDiff = clapDiff.map(function (x) { return { "clapID": x["clapID"], "clapPoint": (x["clapPoint"] + offset) }; });
    let localFileDiff = fileDiff.slice();
    let hits = 0;
    let goodHits = 0;
    let next = -1;
    let possibleFutureHits = clapDiff.length;
    let matches = [];
    for (let i of localClapDiff) {
        if (fileDiff[fileDiff.length - 1][1] < i["clapPoint"]) {
            possibleFutureHits -= 1;
            continue;
        }
        for (let j of localFileDiff.slice()) {
            if (j["startPoint"] > i["clapPoint"]) {
                break;
            }
            localFileDiff.splice(localFileDiff.indexOf(j), 1);
            if (j["startPoint"] <= i["clapPoint"] && j["endPoint"] >= i["clapPoint"]) {
                matches.push({ "clapID": i["clapID"], "fileID": j["fileID"] });
                hits++;
                let percentagePlace = (i["clapPoint"] - j["startPoint"]) / (j["endPoint"] - j["startPoint"]) * 100;
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
            if (i["clapPoint"] < j["startPoint"] && (j["startPoint"] - i["clapPoint"] < next || next === -1)) {
                next = j["startPoint"] - i["clapPoint"];
                localFileDiff.splice(localFileDiff.indexOf(j), 1);
            }
        }
    }
    return [hits, goodHits, next, possibleFutureHits, matches];
}
function match(clapDiff, fileDiff) {
    let currentOffset = 0;
    let bestHits = [-1, -1, -1, -1, []];
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
    return [bestHits[0], bestHits[1], bestHits[4]];
}
function getClapDifferences(clapInfo) {
    if (clapInfo.length === 0) {
        return null;
    }
    let initialTime = clapInfo[0]["clapTime"];
    let returnClapInfo = [];
    for (let i of clapInfo) {
        returnClapInfo.push({ "clapID": i["clapID"], "clapPoint": (i["clapTime"] - initialTime) });
    }
    return returnClapInfo;
}
function getFileDifferences(fileInfo) {
    if (fileInfo.length === 0) {
        return null;
    }
    let initialTime = fileInfo[0]["startTime"];
    let returnData = [];
    for (let i of fileInfo) {
        returnData.push({ "fileID": i["fileID"], "startPoint": (i["startTime"] - initialTime), "endPoint": (i["startTime"] + i["duration"] - initialTime) });
    }
    return returnData;
}
function processTimes(clapInfo, fileInfo) {
    fileInfo = fileInfo.sort((n1, n2) => n1["startTime"] - n2["startTime"]);
    let clapDifferences = getClapDifferences(clapInfo);
    let fileDifferences = getFileDifferences(fileInfo);
    let result = match(clapDifferences, fileDifferences);
    return result;
}

function processPossibleClapProjs(fileData, clapDataClass) {
    return __awaiter(this, void 0, Promise, function* () {
        //getClapData
        let clapData = Parse.Object.extend(clapDataClass);
        let query = new Parse.Query(clapData);
        let possibleProjects = yield query.find();
        if (possibleProjects.length === 0)
            return "!ERR!noPossibleProjects";
        let bestProject;
        let bestMatch;
        for (let possibleProject of possibleProjects) {
            let clapTimes = possibleProject.get("clapTimes");
            let tmpMatch = processTimes(clapTimes, fileData);
            if ((typeof bestMatch === 'undefined' || tmpMatch[0] > bestMatch[0] || (tmpMatch[0] === bestMatch[0] && tmpMatch[1] > bestMatch[1])) && tmpMatch[0] > (clapTimes.length * 0.6)) {
                tmpMatch = bestMatch;
                bestProject = possibleProject;
                if (bestMatch[1] === clapTimes.length)
                    break;
            }
        }
        if (typeof bestMatch === 'undefined')
            return "!ERR!noGoodMatches";
        return bestMatch[2];
    });
}
function processRequest(fileData, clapDataClass, response) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = yield processPossibleClapProjs(fileData, clapDataClass);
            if (typeof result === 'string') {
                response.error(result);
                return;
            }
            else if (result instanceof Array) {
                response.success(result);
                return;
            }
        }
        catch (e) {
            response.error(e);
            return;
        }
    });
}
//Parse.initialize("mainCadenceClap1");
//Parse.serverURL = 'https://parsetestserver.herokuapp.com/parse'
Parse.Cloud.define("processTimes", function (request, response) {
    let fileData = request.params.fileData;
    console.log(request);
    processRequest(fileData, "clapProjs", response);
});
//# sourceMappingURL=app.js.map
const {IsNull, ContainKey, ObjSize} = require('./CommonUtility');
const chalk = require('chalk');
const {performance} = require('perf_hooks');

const systemHeadColor = chalk.rgb(0, 163, 233);
const warningHeadColor = chalk.rgb(228, 218, 86);
const errorHeadColor = chalk.rgb(200, 70, 70);
const debugHeadColor = chalk.rgb(150, 150, 150);
const unitTestHeadColor = chalk.rgb(70, 193, 111);

const systemColor = chalk.rgb(45, 192, 255);
const procedureColor = chalk.rgb(150, 200, 255);
const warningColor = chalk.rgb(230, 224, 134);
const errorColor = chalk.rgb(226, 144, 144);
const debugColor = chalk.rgb(100, 100, 100);
const unitTestSuccessColor = chalk.rgb(0, 222, 111);
const unitTestFailedColor = chalk.rgb(239, 152, 37);

var timerMap = {};

function SystemLog(param, timerParam = {isStart: -1, TimerLabel: ""}){
    var recordDate = new Date(Date.now());
    const dateString = recordDate.toTimeString().split(' ');
    if(timerParam.isStart == 0){
        if(IsNull(timerParam.TimerLabel)){
            ErrorLog(`System Log timerParam.TimerLabe is null or empty`);
            if(!IsNull(param) && param != "")
                console.log(systemHeadColor(`[${dateString[0]}][System] `) + systemColor(param));
            return;
        }
        timerMap[timerParam.TimerLabel] = performance.now();
        if(!IsNull(param) && param != "")
            console.log(systemHeadColor(`[${dateString[0]}][System] `) + systemColor(param));
    }        
    else if(timerParam.isStart == 1){
        if(IsNull(timerParam.TimerLabel)){
            ErrorLog(`System Log timerParam.TimerLabe is null or empty`);
            if(!IsNull(param) && param != "")
                console.log(systemHeadColor(`[${dateString[0]}][System] `) + systemColor(param));
            return;
        }        
        console.log(systemColor(`[${dateString[0]}][System] Procedure ${procedureColor(timerParam.TimerLabel)} used: ${performance.now() - timerMap[timerParam.TimerLabel]} ms`));
        if(!IsNull(param) && param != "")
            console.log(systemHeadColor(`[${dateString[0]}][System] `) + systemColor(param));
        delete timerMap[`${timerParam.TimerLabel}`];
    }
    else
        console.log(systemHeadColor(`[${dateString[0]}][System] `) + systemColor(param));
}

function WarningLog(param){
    var recordDate = new Date(Date.now());
    const dateString = recordDate.toTimeString().split(' ');
    console.log(warningHeadColor(`[${dateString[0]}][Warning] `) + warningColor(param));
}

function ErrorLog(param){
    var recordDate = new Date(Date.now());
    const dateString = recordDate.toTimeString().split(' ');
    console.log(errorHeadColor(`[${dateString[0]}][Error] `) + errorColor(param));
}

function DebugLog(param){
    var recordDate = new Date(Date.now());
    const dateString = recordDate.toTimeString().split(' ');
    console.log(debugHeadColor(`[${dateString[0]}][Debug] `) + debugColor(param));
}
/*
function UnitTestLog(title ,param, isPass, cbAction){
    var recordDate = new Date(Date.now());
    const dateString = recordDate.toTimeString().split(' ');
    if(isPass && !IsNull(param))
        console.log(unitTestHeadColor(`[${dateString[0]}][Unit Test] ${title}`) + param + unitTestSuccessColor(` [PASS]`));
    else{
        console.log(unitTestHeadColor(`[${dateString[0]}][Unit Test]  ${title}`) + param + unitTestFailedColor(` [FAILED]`));
        if(!IsNull(cbAction) && typeof cbAction == "cbAction"){
            cbAction();
        }
    }
}
*/
module.exports.SystemLog = SystemLog;
module.exports.WarningLog = WarningLog;
module.exports.ErrorLog = ErrorLog;
module.exports.DebugLog = DebugLog;
//module.exports.UnitTestLog = UnitTestLog;
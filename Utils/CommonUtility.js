//通用method
const { func } = require("joi");
const diskSpaceChecker = require('check-disk-space').default;
const path = require('path');
const os = require('node-os-utils');
function IsNull(obj){
    if(obj == null || typeof obj == undefined)
        return true;
    else
        return false;
}

function ObjSize(obj){
    return Object.keys(obj).length;
}

function ContainValue(obj, value){
    if(Object.values(obj).indexOf(value) > -1)
        return true;
    else
        return false;
}

function ContainKey(obj, key){
    if(IsNull(obj))
        return false;
    if(obj.hasOwnProperty(key))
        return true;
    else
        return false;
}

class PromiseChain{
    constructor(value){
        this.value = value;
    }

    then(resolve, reject){
        resolve(this.value);
    }
}

function GetSecondsIntervalTime(seconds){
    return seconds * 1000;
}

function GetMinutesIntervalTime(minutes){
    return minutes * 60 * 1000;
}

function GetHoursIntervalTime(hours){
    return hours * 60 * 60 * 1000;
}

function GetFirstName(name){
    var nameArr = name.split(" ");
    return nameArr[1];
}

function GetLastName(name){
    var nameArr = name.split(" ");
    return nameArr[0];
}

//OS related
function GetCPUCore(){
    return os.cpu.count();
}

function GetCPUUsagePrecentage(){
    var result = 0;
    os.cpu.usage().then(cpuPercentage => {result = cpuPercentage;});
    return result;
}

function GetFreeMem_MB(){
    var result = 0;
    os.mem.info().then(info => {
        result = info.freeMemMb
    });
    return result;
}

function GetUsedMem_MB(){
    var result = 0;
    os.mem.info().then(info => {
        result = info.usedMemMb;
    });
    return result;
}

function GetTotalMem_MB(){
    var result = 0;
    os.mem.info().then(info => {
        result = info.totalMemMb
    });
    return result;
}

function GetFreeStorage_MB(){
    var result = 0;
    os.drive.info().then(info => {
        result = info.freeGb * 1024;
    });
    return result;
}

function GetTotalStorage_MB(){
    var result = 0;
    os.drive.info().then(info => {
        result = info.totalGb * 1024;
    });
    return result;
}

function GetUsedStorage_MB(){
    var result = 0;
    os.drive.info().then(info => {
        result = info.usedGb * 1024;
    });
    return result;
}

function GetServerUpTime_S(){
    return process.uptime();
}

function SetCookieExpiry(){
    var obj = {'Set-Cookie':'sesh=wakadoo; expires='+new Date(new Date().getTime()+3600000).toUTCString()}
    return obj
}

function ConditionChecker(str_op, targetValue, condValue){
    //console.log("CHECK: str_op => " + str_op + ", targetValue ＝> " + targetValue + ", condValue => " + condValue)
    if(str_op == null || targetValue == null || condValue == null){
        return false;
    }

    if(typeof(targetValue) != typeof(condValue)){
        return false;
    }

    if(str_op == "=="){
        if(targetValue == condValue){
            return true;
        }
    }
    else if(str_op == "!="){
        if(targetValue != condValue){
            return true;
        }
    }
    else if(str_op == ">="){
        if(typeof(targetValue) != "number" || typeof(condValue) != "number"){
            return false;
        }

        if(targetValue >= condValue){
            return true;
        }
    }
    else if(str_op == "<="){
        if(typeof(targetValue) != "number" || typeof(condValue) != "number"){
            return false;
        }

        if(targetValue <= condValue){
            return true;
        }
    }
    else if(str_op == ">"){
        if(typeof(targetValue) != "number" || typeof(condValue) != "number"){
            return false;
        }

        if(targetValue > condValue){
            return true;
        }
    }
    else if(str_op == "<"){
        if(typeof(targetValue) != "number" || typeof(condValue) != "number"){
            return false;
        }

        if(targetValue < condValue){
            return true;
        }
    }
    else{
        return false;
    }
}

//Enum
const status = {
    OnBlacklist: -2,
    None: -1,
    Pending :0,
    Published: 1,
    Failed: 2,
    Expired: 3,
    Done: 4,
}

const UserTier = {
    user: 0,
    employee: 1,
    employer: 2,    
    cmsStdUser: 10,
    cmsStdAdmin: 11,
    stdCIMPTechUser: 999,
    adminCIMPTechUser: 1000
}

const MsgStatus = {
    unread: 0,
    read: 1,
    delete: 2,
    marked: 3,
}

const StackTokenType = {
    
}

const ServerPropertiesID = {
    RegisterLimit: 1,
    LoginRetryLimit: 2,
    WaitLoginRetryMinute: 3,
    
}

const FeatureID = {
    //Basic User: 1000 ~ 1999
    Login: 1001,
    Register: 1002,
    RegisterEmailVerify: 1003,
    Logout: 1004,
    ForgetPassword: 1005,
    MsgSystem: 1006,
    MailSystem: 1007,
    
    //Basic CMS User: 4000 ~ 4999
    AccessControl: 4001,
    ContentEditor: 4002,
    CRUD: 4003,
    
    //System Features: 8000 ~ 8999
    AutoBackup: 8000,
    AutoBlacklist: 8001,
    AutoBan: 8002,
    WarningNotify: 8003
}

const RequestType = {
    //User System Request
    Register: 0,
    Login: 1,
    ForgetPassword: 2,
    VerifyEmail: 3,
    Logout: 4,
    ForgetPassword: 5,
    ResetPassword: 6,
    VerifyRestPasswordToken: 7,

    //Post System Request
    GetAllPost: 8,
    AddNewPost: 9,
    GetSelfPost: 10,
    UpdateSelfPost: 11,

    //CMS
    CMSLogin: 1999,
    CMSForgetPassword: 2999,
    CMSModifyPassword: 3999,
    CMSContentEditor: 4999,
    CMSUserModify: 5999,
    CMSAddAccount: 6999,
}

const ErrorCode = {
    TargetClientDeivceNotFound: 300,
    TargetContentNotExists: 400,
    TargetAccountNotExists: 500,
    EmailReadyRegister: 501,
    PhoneReadyReigister: 502,
    RegisterInfomationInvalid: 503,
    VerifyLinkIsExpired: 504,
    TargetPostNotExists: 600,
    ResetPassword_PasswordFormatInvalid: 505,
    ProfileNotExists: 700,
    ProfileReadyExists: 701,
    ProfileUpdateEdit3InvalidFormat: 702,
    LocalizationInvalidID: 800,
    LocalizationReadyExists: 801,
    LocalizationNotExists: 802,
    ActionUnknown: 990,
    AccessDenied_FeatureNotOn: 991,
    AccessDenied_Blacklisted: 992,
    AccessDenied_Authority: 993,
    AccessDenied_InvalidEmail: 994,
    AccessDenied_InvalidPassword: 995,
    AccessDenied_ReadyLogin: 996,
    AccessDenied_AccountNotFound: 997,
    AccessDenied_NotYetLogin: 998,
    AccessDenied_UnderMaintenance: 999,
    Blacklist_ReadyOnList: 1000,
    Blacklist_NotOnList: 1001,

    DataMissing: 9998,
    ErrorUnknown: 9999
}

const LANG = {
    HK: 0,
    TW: 1,
    CN: 2,
    EN: 3,
    KR: 4,
    JP: 5,
    ID: 6,
}

const DirectoryPath = {
    main: path.normalize(__dirname + '/../'),
    upload: path.normalize(__dirname + '/../public/upload/'),
}

const AccessControlType ={
    cmsWhitelist: 0,
    blacklistByIP: 1,
    banlist: 2,
    blacklistByAcctUID: 3
}

module.exports.IsNull = IsNull;
module.exports.ObjSize = ObjSize;
module.exports.ContainKey = ContainKey;
module.exports.ContainValue = ContainValue;
module.exports.PromiseChain = PromiseChain;
module.exports.status = status;
module.exports.RequestType = RequestType;
module.exports.GetSecondsIntervalTime = GetSecondsIntervalTime;
module.exports.GetMinutesIntervalTime = GetMinutesIntervalTime;
module.exports.GetHoursIntervalTime = GetHoursIntervalTime;
module.exports.AccessControlType = AccessControlType;
module.exports.FeatureID = FeatureID;
module.exports.UserTier= UserTier;
module.exports.ErrorCode = ErrorCode;
module.exports.MsgStatus = MsgStatus
module.exports.LANG = LANG;
module.exports.DirectoryPath = DirectoryPath;
module.exports.GetCPUCore = GetCPUCore;
module.exports.GetCPUUsagePrecentage = GetCPUUsagePrecentage;
module.exports.GetTotalMem_MB = GetTotalMem_MB;
module.exports.GetUsedMem_MB = GetUsedMem_MB;
module.exports.GetFreeMem_MB = GetFreeMem_MB;
module.exports.GetTotalStorage_MB = GetTotalStorage_MB;
module.exports.GetUsedStorage_MB = GetUsedStorage_MB;
module.exports.GetFreeStorage_MB = GetFreeStorage_MB;
module.exports.SetCookieExpiry = SetCookieExpiry;
module.exports.GetServerUpTime_S = GetServerUpTime_S;
module.exports.ConditionChecker = ConditionChecker;

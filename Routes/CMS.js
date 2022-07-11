const router = require("express").Router();

const DataManager = require('../DataManager');
const DatabaseManager = require('../DatabaseManager');

const CommonUtility = require('../Utils/CommonUtility');
const {SystemLog, WarningLog, ErrorLog, DebugLog} = require('../Utils/DebugUtility');
const { tokenVerify } = require("../Utils/authToken");
const CMSUserAction = require('../Feature/CMSUserAction');
const BasicUserAction = require('../Feature/BasicUserAction');

var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();

router.post("/Login", async (req, res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.body.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.CMSLogin;
    requestLog.Param = `Username: {${req.body.username}}, Password: {${req.body.password}}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const account = dataManager.cmsAcctWhitelist[req.body.username];
    if(!account) return res.status(400).send("Invalid User");

    if(CommonUtility.ContainKey(dataManager.onlineAccount, account.UID)){
        return res.status(406).send(`Account already logged in, redirect to home page`);
    }
    
    const validPass = await bcrypt.compare (req.body.password, account.Password);
    if (!validPass) return res.status(400).send("Invalid Password");

    dataManager.onlineAccount[account.UID] = account;
    account.LastLoginTime = Date.now();
    account.save((err,result)=>{
        if(err) ErrorLog(err);
        dataManager.UpdateAccount(account);
    });
    res.status(200).json({ success: true });
});

router.post("/Register", async (req, res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.body.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.CMSLogin;
    requestLog.Param = `Username: {${req.body.username}}, Password: {${req.body.password}}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const account = dataManager.cmsAcctWhitelist[req.body.username];
    if(!account) return res.status(400).send("Invalid User");

    if(CommonUtility.ContainKey(dataManager.onlineAccount, account.UID)){
        return res.status(406).send(`Account already logged in, redirect to home page`);
    }
    
    const validPass = await bcrypt.compare (req.body.password, account.Password);
    if (!validPass) return res.status(400).send("Invalid Password");

    dataManager.onlineAccount[account.UID] = account;
    account.LastLoginTime = Date.now();
    account.save((err,result)=>{
        if(err) ErrorLog(err);
        dataManager.UpdateAccount(account);
    });
    res.status(200).json({ success: true });
});

router.post("/Forget", async (req, res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.body.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.CMSLogin;
    requestLog.Param = `Username: {${req.body.username}}, Password: {${req.body.password}}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const account = dataManager.cmsAcctWhitelist[req.body.username];
    if(!account) return res.status(400).send("Invalid User");

    if(CommonUtility.ContainKey(dataManager.onlineAccount, account.UID)){
        return res.status(406).send(`Account already logged in, redirect to home page`);
    }
    
    const validPass = await bcrypt.compare (req.body.password, account.Password);
    if (!validPass) return res.status(400).send("Invalid Password");

    dataManager.onlineAccount[account.UID] = account;
    account.LastLoginTime = Date.now();
    account.save((err,result)=>{
        if(err) ErrorLog(err);
        dataManager.UpdateAccount(account);
    });
    res.status(200).json({ success: true });
});

router.post("/Login", async (req, res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.body.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.CMSLogin;
    requestLog.Param = `Username: {${req.body.username}}, Password: {${req.body.password}}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const account = dataManager.cmsAcctWhitelist[req.body.username];
    if(!account) return res.status(400).send("Invalid User");

    if(CommonUtility.ContainKey(dataManager.onlineAccount, account.UID)){
        return res.status(406).send(`Account already logged in, redirect to home page`);
    }
    
    const validPass = await bcrypt.compare (req.body.password, account.Password);
    if (!validPass) return res.status(400).send("Invalid Password");

    dataManager.onlineAccount[account.UID] = account;
    account.LastLoginTime = Date.now();
    account.save((err,result)=>{
        if(err) ErrorLog(err);
        dataManager.UpdateAccount(account);
    });
    res.status(200).json({ success: true });
});

//-----------------Account CRUD-----------------------//
//Read
router.post('/Account', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID];
    const result = await CMSUserAction.CRUD(CMSAcct, "account", "read", req.body.UID, req.body, req.body.Filter);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});

//Add
router.post("/Account/Add", tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID];
    const result = await CMSUserAction.CRUD(CMSAcct, "account", "add", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});

//Update
router.post('/Account/Update', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID];
    const result = await CMSUserAction.CRUD(CMSAcct, "account", "udpate", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

//Delete
router.post('/Account/Delete', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID];
    const result = await CMSUserAction.CRUD(CMSAcct, "account", "delete", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

//-----------------Post CRUD-----------------------//
//Read
router.post ('/Post', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "post", "read", req.body.UID, req.body, req.body.Filter);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
})

//Add
router.post('/Post/Add', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    console.log(req.body);
    const result = await CMSUserAction.CRUD(CMSAcct, "post", "add", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});

//Update
router.post('/Post/Update', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    console.log(req.body);
    const result = await CMSUserAction.CRUD(CMSAcct, "post", "udpate", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});

//Delete
router.post('/Post/Delete', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "post", "delete", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});



//-------------Profile CRUD--------------//
//Read
router.post ('/Profile', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "profile", "read", req.body.UID, req.body, req.body.Filter);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
})

//Add
router.post('/Profile/Add', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID];

    console.log(req.body);
    console.log(req.files);

    const updates = JSON.parse(req.body.Profile)
    const result = await CMSUserAction.CRUD(CMSAcct, "profile", "add", req.body.OwnerUID, updates, null, req.files);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});

//Update
router.post('/Profile/Update', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    console.log(req.files);
    console.log(req.body);

    const updates = JSON.parse(req.body.Profile)
    console.log(JSON.parse(req.body.Profile));
    const result = await CMSUserAction.CRUD(CMSAcct, "profile", "udpate", updates.UID, updates, null, req.files);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});

router.post('/Profile/Update/AvatarImg', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "profile", "upload", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
})
//Detele
router.post('/Profile/Delete', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "profile", "delete", req.body.UID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});

//-----------------Localization CRUD-----------------------//
//Read
router.post ('/Localization', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "localization", "read", req.body.ID, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
})

router.post('/Localization/Add', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "localization", "add", req.body.ID, req.body)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

router.post('/Localization/Update', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "localization", "udpate", req.body.ID, req.body)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

router.post('/Localization/Delete', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.CRUD(CMSAcct, "localization", "delete", req.body.ID, req.body)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

//-----------------Server Status-----------------------//
router.post('/ServerStatus', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.RetreiveServerStatus(CMSAcct)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true, ServerStatus: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

//-----------------File Upload-----------------------//
router.post('/uploadAvatar', tokenVerify, async(req,res)=>{
    // console.log(req.files);
    var CMSAcct = dataManager.accountMap[req.user.UID];
    const result = await CMSUserAction.UploadFile(req.body.UID, req.files);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true, msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

router.post('/Profile/Update/UploadFiles', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    console.log(req.files);
    console.log(req.body);

    //const updates = JSON.parse(req.body.Profile)
    //console.log(JSON.parse(req.body.Profile));
    const result = await CMSUserAction.UploadFile(parseInt(req.body.UID, 10), req.files, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    }
});


//-----------------Blacklist-----------------------//
router.post('/Blacklist', tokenVerify, async(req,res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.Blacklist(CMSAcct, req.body.action, req.body.tarAcctUID, req.body.Filter)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

//-----------------Statistic-----------------------//
router.post('/NewUserStatistic', tokenVerify, async(req, res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.RetreiveNewUserStatistic(CMSAcct)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

router.post('/GetPostCount', tokenVerify, async(req, res)=>{
    var CMSAcct = dataManager.accountMap[req.user.UID]
    const result = await CMSUserAction.GetAllPostCount(CMSAcct)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({msg: result.msg});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

router.ws('/Users', function(ws, req){
    DebugLog("WebSocket: /Users");   
    ws.on('message', function(msg){
        //DebugLog(JSON.stringify(msg));
    });

    let onlineAccountCounter = setInterval(()=>{
        var count = 0;
        for(const[_k, _v] of Object.entries(dataManager.onlineAccount)){
            if(_v.Authority < CommonUtility.UserTier.cmsStdUser){
                count++;
            }
        }
        ws.send(JSON.stringify({usersCount: count}));
    }, 1000);

    ws.on('close', function(){
        clearInterval(onlineAccountCounter);
    });

});

router.ws('/AllUsers', function(ws, req){
    DebugLog("WebSocket: /AllUsers");   
    ws.on('message', function(msg){
        
    });

    let accountCounter = setInterval(()=>{
        var count = 0;
        for(const[_k, _v] of Object.entries(dataManager.accountMap)){
            if(_v){
                count++;
            }
        }
        ws.send(JSON.stringify({usersCount: count}));
    }, 1000);

    ws.on('close', function(){
        clearInterval(accountCounter);
    });

});
//------------Profile applied job/post------------//
router.ws('/ProfileApplied/Post', function(ws, req) {
    DebugLog("WebSocket: /ProfileApplied/Post"); 

    let PendingPostJob = setInterval(()=>{
        var count = 0;
        var postList = {};
        for(const[_k, _v] of Object.entries(dataManager.appliedPost)){
            count++;
            if(count > 5){
                break;
            }
            if((_v != undefined || _v != null) && count < 5){
                postList[_v.UID] = _v;
            }
        }
        ws.send(JSON.stringify(postList));
    }, 2000);

    ws.on('close', function(){
        clearInterval(PendingPostJob);
    });
});

router.ws('/ProfileApplied/Helper', function(ws, req) {
    DebugLog("WebSocket: /ProfileApplied/Helper"); 

    let PendingHelperJob = setInterval(()=>{
        var count = 0;
        var profileList = {};
        for(const[_k, _v] of Object.entries(dataManager.appliedHelper)){
            count++;
            if(count > 5){
                break;
            }
            if((_v != undefined || _v != null) && count < 5){
                profileList[_v.UID] = _v;
            }
        }
        ws.send(JSON.stringify(profileList));
    }, 1000);

    ws.on('close', function(){
        clearInterval(PendingHelperJob);
    });
});

//-----------------Approval-----------------------//
router.ws('/Approval/Post', function(ws, req) {
    DebugLog("WebSocket: /Approval/Post"); 

    let PendingPostJob = setInterval(()=>{
        ws.send(JSON.stringify(dataManager.postMapByStatus[CommonUtility.status.Pending]));
    }, 1000);

    ws.on('close', function(){
        clearInterval(PendingPostJob);
    });
});

router.ws('/Approval/Helper', function(ws, req) {
    DebugLog("WebSocket: /Approval/Helper"); 

    let PendingHelperJob = setInterval(()=>{
        ws.send(JSON.stringify(dataManager.profileMapByStatus[CommonUtility.status.Pending]));
    }, 1000);

    ws.on('close', function(){
        clearInterval(PendingHelperJob);
    });
});

//-----------------Both Liked-----------------------//
router.ws('/Like', function(ws, req) {
    DebugLog("WebSocket: /Users");   

    let pariUpJob = setInterval(()=>{
        ws.send(JSON.stringify(dataManager.applyEachOther));
    }, 1000);

    ws.on('close', function(){
        clearInterval(pariUpJob);
    });
});
module.exports = router;
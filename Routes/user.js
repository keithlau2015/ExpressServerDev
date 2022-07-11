const router = require("express").Router();
const cookieParser = require("cookie-parser");
const fs = require('fs');
const DataManager = require('../DataManager');
const DatabaseManager = require('../DatabaseManager');
const {ErrorLog, DebugLog} = require('../Utils/DebugUtility');
const CommonUtility = require('../Utils/CommonUtility');
const BasicUserAction = require('../Feature/BasicUserAction');
const { tokenVerify } = require("../Utils/authToken");

router.use(cookieParser());

var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();

router.post ('/register', async(req,res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.Register;
    requestLog.Param = `Email: ${req.body.email}, Password: ${req.body.password}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.Register(req.body.authority, req.body.first_name, req.body.last_name, req.body.phone, req.body.ip, req.body.platform, req.body.email, req.body.password, req.body.birth, req.body.device, req.body.os_Name_Version, req.body.lang);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({ success: true, data: result.msg});
    }
    
    else{
        if(CommonUtility.IsNull(result.extraObj))
            return res.status(400).send(result.msg);
        else
            return res.status(400).send(result.extraObj);
    }
});

router.post('/verify', async (req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.platform;
    requestLog.Type = CommonUtility.RequestType.VerifyEmail;
    requestLog.Param = `Verify Token: ${req.body.token}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });
    

    const result = await BasicUserAction.EmailVerify(req.body.token);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).cookie('auth_token', result.authToken).json(result.msg);
    }
    else if(result.responseStatus == 201){
        return res.status(201).cookie('auth_token', result.authToken).json({ success: true, data: result.msg});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
});

router.post ('/login', async(req,res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.Login;
    requestLog.Param = `Email: ${req.body.email}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.Login(req.body.email, req.body.password, req.body.ip, req.body.os_Name_Version, req.body.device);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).cookie('auth_token', result.authToken).json({ success: true, "auth-token": result.authToken });
    }
    else if(result.responseStatus == 401){
        return res.status(401).json(result.msg)
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
});

router.post('/logout', tokenVerify, async(req, res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.Logout;
    requestLog.Param = `Account UID: ${req.user.UID}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.Logout(req.user.UID);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
});

router.post('/forgot', async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.ForgetPassword;
    requestLog.Param = `Email: ${req.body.email}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });
    var result = await BasicUserAction.ForgetPassword(req.body.email, req.body.lang);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
});

router.post('/resetTokenVerify', async (req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.VerifyRestPasswordToken;
    requestLog.Param = `Verify Token: ${req.body.token}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var result = await BasicUserAction.ResetEmailVerifyToken(req.body.token);
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
});

router.post("/reset", async (req, res) => {
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.ResetPassword;
    requestLog.Param = `Verify Token: ${req.query.token}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var result = await BasicUserAction.ResetPassword(req.body.token, req.body.password);
    //success case
    if(result.responseStatus == 200){
        return res.status(200).cookie('auth_token', result.authToken).json({ success: true, "auth-token": result.authToken });
    }
    //fail case
    else if(result.responseStatus == 406){
        return res.status(406).json(result.msg);
    }
    else{
        return res.status(400).json(result.msg);
    }
});

router.post("/myProfile", tokenVerify, async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Verify Token: ${req.query.token}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var result = await BasicUserAction.GetMyProfile(req.user.UID);
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post("/myProfile/resetPassword", tokenVerify, async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Verify Token: ${req.query.token}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var result = await BasicUserAction.ResetMyPassword(req.user.UID, req.body.old_password, req.body.new_password);
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post("/editProfile",tokenVerify, async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `User Profile Update: ${req.body.UID}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var result = await BasicUserAction.EditProfile(req.body.profileUID, req.body.first_name, req.body.last_name, req.body.phone, req.body.address);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/editDetail/:id', tokenVerify, async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `User: ${req.user.UID} Edit Detail Page [${req.params.id}]`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    if(req.params.id == 1) {
        var result = await BasicUserAction.EditDetail1(req.user.UID, req.body.gender, req.body.location, req.body.contract, req.body.avaliable_date, req.body.nationality,req.body.education, req.body.religion, req.body.marriage, req.body.spouse_occupation, req.body.num_of_children, req.body.weight, req.body.height, req.body.language, req.body.intro);
    }

    if(req.params.id == 2) {
        var result = await BasicUserAction.EditDetail2(req.user.UID, req.body.nd,req.body.d, req.body.skills);
    }

    if(req.params.id == 3) {
        var result = await BasicUserAction.EditDetail3(req.user.UID, req.body.priority,req.body.info, req.body.salary);
    }

    if(req.params.id == 5) {
        var result = await BasicUserAction.EditDetail5(req.user.UID, req.body.declaration);
    }
    

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/getDetail/:page', tokenVerify, async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Verify Token: ${req.headers.token}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var result = await BasicUserAction.GetDetail(req.user.UID, req.params.page);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/recall', tokenVerify, async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Verify Token: ${req.headers.token}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var result = await BasicUserAction.RecallProfile(req.user.UID)

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/fileUpload', tokenVerify, async(req,res)=>{
    // console.log(req);
    // const result = await BasicUserAction.UploadFile(req.user.UID, req.files);

    // //success case
    // if(result.responseStatus == 200){
    //     return res.status(200).json({success: true});
    // }
    // //fail case
    // else{
    //     return res.status(400).json({errorCode: result.errorCode, msg: result.msg});
    // }
    
    console.log(req.files);
    console.log(req.body);
    const result = await BasicUserAction.UploadFile(req.user.UID, req.files, req.body);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true, msg: result.msg});
    }
    else if(result.responseStatus == 204){
        return res.status(204).json({msg: "No File Uploaded"});
    }
    //fail case
    else{
        return res.status(400).json({errorCode: result.errorCode});
    }
});

router.post('/getFile', async(req,res)=>{
    var result = { responseStatus: 200, errorCode: 0, msg:''};
    //const result = await BasicUserAction.GetFile(req.body.path);

    try{
        var fileContent = fs.readFileSync(req.body.path)
        
        result.msg = fileContent;
    
        //success case
        return res.status(200).send(result.msg)
    } catch(err) {
        return res.status(400).json({errorCode: result.errorCode, msg: "file is not exist"});
    }
    

});  
    

module.exports = router;

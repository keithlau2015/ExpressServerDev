const Joi = require('joi');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const PasswordComplexity = require('joi-password-complexity');

const DataManager = require('../DataManager');
const DatabaseManager = require('../DatabaseManager');
const sendEmail = require('../Utils/sendEmail');
const upload = require('../Utils/upload');
const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const CommonUtility = require('../Utils/CommonUtility');
const DebugUtility = require('../Utils/DebugUtility');
var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();

async function Login(email, password, ip, os_Name_Version, device){
    var result = { responseStatus: 200, msg: "", errorCode: 0, authToken: ""};

    //retrieve data
    const targetUser = dataManager.accountMapByEmail[email];

    //validation
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.Login].isActive){
        DebugUtility.ErrorLog(`Login feature is not on`);
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        return result;
    }

    if(!targetUser){
        DebugUtility.ErrorLog(`User[${email}] not found`);
        result.msg = "AccessDenied_AccountNotFound";
        result.responseStatus = 401;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        return result;
    }

    if(dataManager.blacklistByAcctUID[targetUser.UID]){
        DebugUtility.ErrorLog(`${targetUser.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    const clientDevice = dataManager.clientDeviceMapByOwner[targetUser.UID];
    //check is target on the blacklistByIP
     if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${targetUser.Email} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //validate before create user
    const schema = Joi.object({
        email: Joi.string().email().allow(''),
        password: Joi.string().required()
    });
    
    var validateResult = schema.validate({email: email, password: password});
    if (validateResult.error) {
        DebugUtility.ErrorLog(validateResult.error);
        result.msg = validateResult.error;
        result.responseStatus = 400;
        return result;
    }

    // bcrypt.compare(password, targetUser.Password, (err,res)=>{
    //     //err action
    //     if (err) {
    //         // error action
    //         DebugUtility.ErrorLog(`User[${targetUser.UID}] login failed., unexpected error`);
    //         result.msg = err;
    //         result.errorCode = CommonUtility.ErrorCode.AccessDenied_InvalidPassword;
    //         result.responseStatus = 400;
    //         return result;
    //     } 

    //     if (res) {
    //          //check if the user is online or not
    //         var onlineUser = dataManager.onlineAccount[targetUser.UID];
    //         if(onlineUser){
    //             /*
    //             result.msg = `User already logged in, redirect to home page`;
    //             result.errorCode = CommonUtility.ErrorCode.AccessDenied_ReadyLogin;
    //             result.responseStatus = 400;
    //             return result;
    //             */
    //             DebugUtility.WarningLog(`User[${onlineUser.UID}] already logged in, logout the pervious one`);
    //             delete dataManager.onlineAccount[targetUser.UID];
    //         }

    //         //User success login
            
    //         targetUser.LastLoginTime = Date.now();
    //         targetUser.save((err,result)=>{
    //             if(err) DebugUtility.ErrorLog(err);
    //                 dataManager.UpdateAccount(targetUser);
    //         });
            
    //         if(!CommonUtility.IsNull(clientDevice) && (clientDevice.IP != ip || clientDevice.OS != os_Name_Version || clientDevice.DeviceType != device)){
    //             clientDevice.IP = ip;
    //             clientDevice.OS = os_Name_Version;
    //             clientDevice.DeviceType = device;
    //             clientDevice.save((err, result) => {
    //                 if(err) DebugUtility.ErrorLog(err);
    //                 dataManager.UpdateClientDevice(clientDevice);
    //             });
    //         }

    //         dataManager.onlineAccount[targetUser.UID] = targetUser;

    //         //Create Token
    //         result.authToken = jwt.sign({UID: targetUser.UID}, "123");
    //         DebugUtility.DebugLog(`User: ${email} has been login, auth_token: ${result.authToken}`);

            
    //     }
    //     else {
    //         // password not match action
    //         DebugUtility.ErrorLog(`User[${targetUser.UID}] login failed., password is not correct`);
    //         result.msg = "Invalid Password, Please try again";
    //         result.errorCode = CommonUtility.ErrorCode.AccessDenied_InvalidPassword;
    //         result.responseStatus = 400;
    //         return result;
    //     }
        
    // });
    // return result;

    //=====================old code down here===========
    //check if the password is correct
    const validPass = await bcrypt.compare (password, targetUser.Password);
    if (!validPass) {
        DebugUtility.ErrorLog(`User[${targetUser.UID}] login failed., password is not correct`);
        result.msg = "Invalid Password, Please try again";
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_InvalidPassword;
        result.responseStatus = 401;
        return result;
    }
    
    
    //check if the user is online or not
    var onlineUser = dataManager.onlineAccount[targetUser.UID];
    if(onlineUser){
        /*
        result.msg = `User already logged in, redirect to home page`;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_ReadyLogin;
        result.responseStatus = 400;
        return result;
        */
        DebugUtility.WarningLog(`User[${onlineUser.UID}] already logged in, logout the pervious one`);
        delete dataManager.onlineAccount[targetUser.UID];
    }

    //User success login
    
    targetUser.LastLoginTime = Date.now();
    targetUser.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
            dataManager.UpdateAccount(targetUser);
    });
    
    if(!CommonUtility.IsNull(clientDevice) && (clientDevice.IP != ip || clientDevice.OS != os_Name_Version || clientDevice.DeviceType != device)){
        clientDevice.IP = ip;
        clientDevice.OS = os_Name_Version;
        clientDevice.DeviceType = device;
        clientDevice.save((err, result) => {
            if(err) DebugUtility.ErrorLog(err);
            dataManager.UpdateClientDevice(clientDevice);
        });
    }

    dataManager.onlineAccount[targetUser.UID] = targetUser;

    //Create Token
    result.authToken = jwt.sign({UID: targetUser.UID}, "123");
    DebugUtility.DebugLog(`User: ${email} has been login, auth_token: ${result.authToken}`);

    return result;
}

async function Register(authority, first_name, last_name, phone, ip, platform, email, password, birth, device, os_Name_Version, language){
    var result = { responseStatus: 200, errorCode: 0, msg: "", extraObj: {}};

    //validation
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.Register].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    /*
    if(dataManager.blacklistByAcctUID[targetUser.UID]){
        DebugUtility.ErrorLog(`${targetUser.Email} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[targetUser.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }
    */

    //account infomation validate before create user
    const schema = Joi.object({
        authority: Joi.boolean(),
        first_name: Joi.string(),
        last_name: Joi.string(),
        phone: Joi.string(),
        ip:Joi.string(),
        platform: Joi.string(),
        email: Joi.string().required().email(),
        password: new PasswordComplexity({
            min: 8,
            max: 25,
            lowerCase: 1,
            upperCase: 1,
            numeric: 1,
            requirementCount:3
        }),
        birth: Joi.number(),
        device: Joi.string(),
        os_Name_Version: Joi.string(),
    });
    var validateResult = schema.validate({authority:authority, first_name: first_name, last_name: last_name, phone: phone, ip: ip, platform: platform, email: email, password: password, birth: birth, device: device, os_Name_Version: os_Name_Version});
    if (validateResult.error) {
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.RegisterInfomationInvalid;
        result.responseStatus = 400;
        return result;
    }

    //check if the email is alrdy in DB
    /*
    const emailExist = dataManager.accountMapByEmail[email];
    if (emailExist) {
        result.extraObj = {email: true};
        result.errorCode = CommonUtility.ErrorCode.EmailReadyRegister;
        result.responseStatus = 400;
        return result;
    }
    */

    //check if the phone number is alrdy in DB
    
    const phoneExist = dataManager.profileMapByPhoneNumber[phone];
    if (phoneExist) {
        result.extraObj = {phone: true};
        result.errorCode = CommonUtility.ErrorCode.PhoneReadyReigister;
        result.responseStatus = 400;
        return result;
    }
    

    //Hash Password (10=saltRounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    //Create email verift token
    const emailToken = crypto.randomBytes(64).toString("hex");

    //Caching
    //Create new user
    var newAccount = new databaseManager.AccountModel();
    newAccount.UID = dataManager.GetAccountUID();
    newAccount.Email = email;
    newAccount.Password = hashedPassword;
    if (authority == true){
        newAccount.Authority = CommonUtility.UserTier.employer;
    }
    if (authority == false){
        newAccount.Authority = CommonUtility.UserTier.employee;
    }
    

    //Create new profile
    var newProfile = new databaseManager.ProfileModel();
    newProfile.UID = dataManager.GetProfileUID();
    newProfile.FirstName = first_name;
    newProfile.LastName = last_name;
    newProfile.PhoneNumber = phone;
    newProfile.Birth = birth;
    newProfile.OwnerUID = newAccount.UID;
    newProfile.Email = email;

    if (authority == true){
        newAccount.Authority = 1;
        newProfile.Authority = 1;
    }
    if (authority == false){
        newAccount.Authority = 2;
        newProfile.Authority = 2;
    }

    //Create new client device
    var newClientDevice = new databaseManager.ClientDeviceModel();
    newClientDevice.UID = dataManager.GetClientDeviceUID();
    newClientDevice.OwnerUID = newAccount.UID;
    newClientDevice.DeviceType = device;
    newClientDevice.OS = os_Name_Version;
    newClientDevice.IP = ip;

    //Add to pending cache
    var dateObj = new Date();
    dateObj.setTime(dateObj.getTime() + CommonUtility.GetMinutesIntervalTime(5));
    dataManager.pendingVerifyUserMap[emailToken] = {account: newAccount, profile: newProfile, clientDevice: newClientDevice, ExpiredTime: dateObj.getUTCMilliseconds()};

    if(dataManager.serverFeatureData[CommonUtility.FeatureID.RegisterEmailVerify].isActive){
        const serverConfig = dataManager.serverProperties[0];

        let emailtext;
        let emailsubj;
        if(language == "HK"){
            emailtext = dataManager.localizationMap[999994].LangHK;
            emailsubj = dataManager.localizationMap[999993].LangHK;
        } 
        else if(language == "ID") {
            emailtext = dataManager.localizationMap[999994].LangID;
            emailsubj = dataManager.localizationMap[999993].LangID;
        }
        else {
            emailtext = dataManager.localizationMap[999994].LangEN;
            emailsubj = dataManager.localizationMap[999993].LangEN;
        }
        emailtext = emailtext.replace("${name}", first_name)
        emailtext = emailtext.replace("${link}", `http://192.168.50.149:3000/verify?token=${emailToken}`)
        
        try{
            //Send Verification Email
            sendEmail({
                mailhost: serverConfig.EmailHost,
                mailport: serverConfig.EmailPort,
                mailsecure: serverConfig.EmailSSL,
                mailusername: serverConfig.EmailUsername,
                mailpass: serverConfig.EmailPassword,
                to: newAccount.Email,
                subject: emailsubj,
                text: emailtext
            });
            result.msg = "verification email sent";
        }
        catch(err){
            result.msg = `${err}`;
            result.responseStatus = 400;
        }
    }

    return result;
}

async function Logout(accountUID){
    var result = { responseStatus: 200, errorCode: 0, msg: ""};
    //Retrieve Data
    const targetUser = dataManager.accountMap[accountUID];
    const onlineUser = dataManager.onlineAccount[accountUID];

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.Logout].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!targetUser) {
        result.msg = "User not found...";
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(!onlineUser) {
        result.msg = "User not online...";
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_NotYetLogin;
        result.responseStatus = 400;
        return result;
    }

    delete dataManager.onlineAccount[accountUID];
    DebugUtility.DebugLog(`User[${onlineUser.UID}] logout`);

    return result;
}

async function ForgetPassword(email, language){
    var result = { responseStatus: 200, errorCode: 0, msg: ""};
    //Retrieve Data
    const user = dataManager.accountMapByEmail[email];
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!user){
        result.msg = "User not found";
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[user.UID]){
        DebugUtility.ErrorLog(`${user.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[user.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    var forgotToken = crypto.randomBytes(64).toString("hex");
    console.log(forgotToken);
    var dateObj = new Date();
    dateObj.setTime(dateObj.getTime() + CommonUtility.GetHoursIntervalTime(1));
    dataManager.pendingVerifyForgetPasswordMap[forgotToken] = {account: user, ExpiredTime: dateObj.getUTCMilliseconds()};

    const serverConfig = dataManager.serverProperties[0]

    let emailtext;
    let emailsubj;
    if(language == "HK"){
        emailtext = dataManager.localizationMap[999992].LangHK;
        emailsubj = dataManager.localizationMap[999991].LangHK;
    } 
    else if(language == "ID") {
        emailtext = dataManager.localizationMap[999992].LangID;
        emailsubj = dataManager.localizationMap[999991].LangID;
    }
    else {
        emailtext = dataManager.localizationMap[999992].LangEN;
        emailsubj = dataManager.localizationMap[999991].LangEN;
    }
    emailtext = emailtext.replace("${name}", dataManager.profileMapByOwner[user.UID].FirstName)
    emailtext = emailtext.replace("${link}", `http://192.168.50.149:3000/forgotpassword?token=${forgotToken}`)

    try{
        sendEmail({
            mailhost: serverConfig.EmailHost,
            mailport: serverConfig.EmailPort,
            mailsecure: serverConfig.EmailSSL,
            mailusername: serverConfig.EmailUsername,
            mailpass: serverConfig.EmailPassword,
            to: user.Email,
            subject: emailsubj,
            text: emailtext
          });
        DebugUtility.SystemLog(`${user.Email} requested password reset.`);
        result.msg = "Reset Email Sent~";
        return result;
    }
    catch (err){
        DebugUtility.ErrorLog(err);
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.ErrorUnknown;
        result.msg = `${err}`;
        return result;
    }
}

async function EmailVerify(verifyToken){
    var result = { responseStatus: 200, errorCode: 0, msg: "", authToken:""};
    //Retrieve Data
    const user = dataManager.pendingVerifyUserMap[verifyToken];
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.RegisterEmailVerify].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!user || !user.account || !user.profile || !user.clientDevice){
        result.msg = "Your verify link is expired or exists, please register again";
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[user.account.UID]){
        DebugUtility.ErrorLog(`${user.account.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[user.account.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    if(user.account.Authority == 2){
        result.responseStatus = 201;
    }
    
    //Record to DB
    //Save User
    user.account.LastLoginTime = Date.now();
    user.account.save((err,result)=>{
        if (err) DebugUtility.ErrorLog(err);
        dataManager.AddNewAccount(user.account);
    });
    
    //Save Profile
    user.profile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.AddNewProfile(user.profile);
    });
    
    //Save Client Device
    user.clientDevice.save((err, result) => {
        if(err) DebugUtility.ErrorLog(err);
        dataManager.AddNewClientDevice(user.clientDevice);
    });

    //Create Account Log
    var accountLog = databaseManager.AccountLogModel();
    accountLog.AcctUID = user.account.UID;
    accountLog.ActionType = "Register";
    accountLog.Param = `Email[${user.account.Email}], Password[${user.account.Password}], Profile[${user.profile.UID}] ClientDeviceID[${user.clientDevice.UID}]`;
    accountLog.save((err, result)=>{
       if(err) DebugUtility.ErrorLog(err);
    });

    
    
    DebugUtility.DebugLog(`User: ${user.account.Email} has been login`);
    
    dataManager.onlineAccount[user.account.UID] = user.account;
    if(!CommonUtility.ContainKey(dataManager.accountMap, user.account.UID)){
        dataManager.accountMap[user.account.UID] = user.account;
    }
    //create token
    result.authToken = jwt.sign({UID: user.account.UID}, "123");
    DebugUtility.DebugLog(`auth token:[${result.authToken}]`);

    //Caching
    delete dataManager.pendingVerifyUserMap[verifyToken];

    result.msg = "Verification has done!";
    return result;
}

async function ResetPassword(verifyToken, newPassword){
    var result = { responseStatus: 200, errorCode: 0, msg: "", authToken: ""};
    //Retrieve Data
    const user = dataManager.pendingVerifyForgetPasswordMap[verifyToken];
    
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!user){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[user.account.UID]){
        DebugUtility.ErrorLog(`${user.account.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[user.account.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const acct = dataManager.accountMap[user.account.UID]

    //check if the password is old password
    const validPass = await bcrypt.compare (newPassword, acct.Password);
    console.log(validPass);
    if (validPass == true) {
        result.msg = "Invalid Password, Please try again";
        result.errorCode = 406;
        result.responseStatus = 406;
        return result;
    }

    const schema = Joi.object({
        forgotToken: Joi.string(),
        password: new PasswordComplexity({
            min: 8,
            max: 25,
            lowerCase: 1,
            upperCase: 1,
            numeric: 1,
            requirementCount:3
        })
    });
    var validateResult = schema.validate({forgotToken: verifyToken, password: newPassword});
    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        return result;
    }

    //Hash Password
    //const salt = bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
    acct.Password = hashedPassword;

    acct.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdateAccount(acct);
    });
    
    result.msg = "Password has been reset.";
    //Create Token
    result.authToken = jwt.sign({UID: acct.UID}, "123");

    delete dataManager.pendingVerifyForgetPasswordMap[verifyToken];

    return result;
}

async function ResetMyPassword(AcctUID, OldPassword, NewPassword){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const targetUser = dataManager.accountMap[AcctUID];
    
    if(!targetUser){
        result.msg = "AccessDenied_AccountNotFound";
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        return result;
    }

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[targetUser.UID]){
        DebugUtility.ErrorLog(`${targetUser.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }
    
    //check if the password is correct
    const validPass = bcrypt.compare (OldPassword, targetUser.Password);
    if (!validPass) {
        result.msg = "Invalid Password, Please try again";
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_InvalidPassword;
        result.responseStatus = 400;
        return result;
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[targetUser.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const schema = Joi.object({
        NewPassword: new PasswordComplexity({
            min: 8,
            max: 25,
            lowerCase: 1,
            upperCase: 1,
            numeric: 1,
            requirementCount:3
        })
    });

    var validateResult = schema.validate({NewPassword: NewPassword});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        return result;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    targetUser.Password = hashedPassword;

    targetUser.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdateAccount(targetUser);
    });
    
    result.msg = "User Password has been updated";
    return result;
}

async function ResetEmailVerifyToken(verifyToken){
    var result = { responseStatus: 200, errorCode: 0,  msg: ""};
    //Retrieve Data
    const user = dataManager.pendingVerifyForgetPasswordMap[verifyToken];

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!user){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    // delete dataManager.pendingVerifyForgetPasswordMap[verifyToken];

    return result;
}

async function GetMyProfile(acctUID){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const userProfile = dataManager.profileMapByOwner[acctUID];

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        DebugUtility.ErrorLog(`Error Code: ${result.errorCode}`);
        return result;        
    }

    if(!userProfile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.ProfileNotExists;
        result.responseStatus = 400;
        DebugUtility.ErrorLog(`Error Code: ${result.errorCode}`);
        return result;
    }

    if(dataManager.blacklistByAcctUID[acctUID]){
        DebugUtility.ErrorLog(`${acctUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[acctUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    /*
    result.msg.profile_UID = userProfile.UID;
    result.msg.first_name = userProfile.FirstName;
    result.msg.last_name = userProfile.LastName;
    result.msg.phone = userProfile.PhoneNumber;
    */

    result.msg = userProfile;
    return result;
}

async function EditProfile(profUID, FirstName, LastName, PhoneNumber, Address){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const profile = dataManager.profileMap[profUID];
    
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!profile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[profile.OwnerUID]){
        DebugUtility.ErrorLog(`${profile.OwnerUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[profile.OwnerUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const schema = Joi.object({
        FirstName: Joi.string().required(),
        LastName: Joi.string().required(),
        PhoneNumber: Joi.string().required(),
        Address: Joi.array()
    });

    var validateResult = schema.validate({FirstName: FirstName, LastName: LastName, PhoneNumber: PhoneNumber, Address: Address});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        return result;
    }

    profile.FirstName = FirstName;
    profile.LastName = LastName;
    profile.PhoneNumber = PhoneNumber;
    profile.Address = Address;

    profile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdateProfile(profile);
    });
    
    result.msg = "Profile has been updated";
    return result;
}

async function EditDetail1(UID, Gender, Location, ContractStatus, AvaliableDate, Nationality, Education, Religion, Marriage, Spouse, NumOfChild, Weight, Height, Language, Intro){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const profile = dataManager.profileMapByOwner[UID];
    
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!profile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[profile.OwnerUID]){
        DebugUtility.ErrorLog(`${profile.OwnerUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[profile.OwnerUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const schema = Joi.object({
        Gender: Joi.string().required(),
        Location: Joi.string().required(),
        ContractStatus: Joi.string().required(),
        AvaliableDate: Joi.number().required(),
        Nationality: Joi.string().required(),
        Education: Joi.string().required(),
        Religion: Joi.string().required(),
        Marriage: Joi.string().required(),
        Spouse: Joi.string().allow(""),
        NumOfChild: Joi.number(),
        Weight: Joi.number().required(),
        Height: Joi.number().required(),
        Language: Joi.array().required(),
        Intro: Joi.string().required()
    });

    var validateResult = schema.validate({Gender: Gender, Location: Location,ContractStatus: ContractStatus, AvaliableDate: AvaliableDate, Nationality: Nationality, Education: Education, Religion: Religion, Marriage: Marriage, Spouse: Spouse, NumOfChild: NumOfChild, Weight: Weight, Height: Height, Language: Language, Intro: Intro});

    if(validateResult.error){
        console.log(validateResult);
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        return result;
    }

    //enum for contract status
    var contractNum = 0;
    if (ContractStatus === "FinishedContract") contractNum =3;
    if (ContractStatus === "FinishedContractWithSpecialReason") contractNum =4;
    if (ContractStatus === "TerminatedOrBreakContract") contractNum =5;
    if (ContractStatus === "ExHK") contractNum =1;
    if (ContractStatus === "Ex-Oversea") contractNum =2;
    if (ContractStatus === "FirstTimeOversea") contractNum =0;

    profile.Gender = Gender;
    profile.Location = Location;
    profile.ContractStatus = contractNum;
    profile.AvailableDate = AvaliableDate;
    profile.Nationality = Nationality;
    profile.Education = Education;
    profile.Religion = Religion;
    profile.Marriage = Marriage;
    profile.Spouse = Spouse;
    profile.NumOfChild = NumOfChild;
    profile.Weight = Weight;
    profile.Height = Height;
    profile.Language = Language;
    profile.Intro = Intro;


    profile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        //dataManager.UpdateProfile(profile);
    });

    dataManager.UpdateProfile(profile);

    
    result.msg = "Profile has been updated";
    return result;
}

async function EditDetail2(UID, NonDomesticExp, DomesticExp, Skills){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const profile = dataManager.profileMapByOwner[UID];
    
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!profile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[profile.OwnerUID]){
        DebugUtility.ErrorLog(`${profile.OwnerUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[profile.OwnerUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }    

    const schema = Joi.object({
        NonDomesticExp: Joi.array(),
        DomesticExp: Joi.array(),
        Skills: Joi.array().required(),
    });

    var validateResult = schema.validate({NonDomesticExp: NonDomesticExp, DomesticExp: DomesticExp, Skills: Skills});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        return result;
    }

    //enum for skills
    var skillsObj = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    if (Skills.find(function(item){return item === "ChineseFood"})) skillsObj[0] =true;
    if (Skills.find(function(item){return item === "WesternFood"})) skillsObj[1] =true;
    if (Skills.find(function(item){return item === "CareNewBorn"})) skillsObj[2] =true;
    if (Skills.find(function(item){return item === "CareToddlers"})) skillsObj[3] =true;
    if (Skills.find(function(item){return item === "CareKids"})) skillsObj[4] =true;
    if (Skills.find(function(item){return item === "CareElderly"})) skillsObj[5] =true;
    if (Skills.find(function(item){return item === "CareDisable"})) skillsObj[6] =true;
    if (Skills.find(function(item){return item === "PetCare"})) skillsObj[7] =true;
    if (Skills.find(function(item){return item === "Gardening"})) skillsObj[8] =true;
    if (Skills.find(function(item){return item === "Marketing"})) skillsObj[9] =true;
    if (Skills.find(function(item){return item === "CarWashing"})) skillsObj[10] =true;
    if (Skills.find(function(item){return item === "Housekeeping"})) skillsObj[11] =true;
    if (Skills.find(function(item){return item === "TutoringChildren"})) skillsObj[12] =true;
    if (Skills.find(function(item){return item === "Driving"})) skillsObj[13] =true;
    if (Skills.find(function(item){return item === "Cooking"})) skillsObj[14] =true;

    profile.NonDomesticExp = NonDomesticExp;
    profile.DomesticExp = DomesticExp;
    profile.Skills = skillsObj;


    profile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdateProfile(profile);
    });
    
    result.msg = "Profile has been updated";
    return result;
}

async function EditDetail3(UID, Priority, Info, Salary){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const profile = dataManager.profileMapByOwner[UID];
    
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!profile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[profile.OwnerUID]){
        DebugUtility.ErrorLog(`${profile.OwnerUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[profile.OwnerUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const schema = Joi.object({
        Priority: Joi.array(),
        Info: Joi.array(),
        Salary: Joi.number()
    });

    var validateResult = schema.validate({Priority: Priority, Info: Info, Salary: Salary});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ProfileUpdateEdit3InvalidFormat;
        DebugUtility.ErrorLog(`ErrorCode: ${result.errorCode}\n Details: ${validateResult.error}`);
        result.responseStatus = 400;
        return result;
    }

    profile.Priority = Priority;
    profile.Info = Info;
    profile.Salary = Salary;
    

    await profile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdateProfile(profile);
    });
    
    result.msg = "Profile has been updated";
    return result;
}

async function EditDetail5(UID, Declaration){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const profile = dataManager.profileMapByOwner[UID];
    
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!profile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[profile.OwnerUID]){
        DebugUtility.ErrorLog(`${profile.OwnerUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[profile.OwnerUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const schema = Joi.object({
        Declaration: Joi.boolean()
    });

    var validateResult = schema.validate({Declaration: Declaration});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        return result;
    }

    profile.Declaration = Declaration;
    profile.Status = 0;

    profile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdateProfile(profile);
    });
    
    result.msg = "Profile has been updated";
    return result;
}

async function GetDetail(AcctUID, Page){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const userProfile = dataManager.profileMapByOwner[AcctUID];
    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!userProfile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[AcctUID]){
        DebugUtility.ErrorLog(`${AcctUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[AcctUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    if (Page == 1){
        result.msg.nationality = userProfile.Nationality;
        result.msg.education = userProfile.Education;
        result.msg.religion = userProfile.Religion;
        result.msg.marriage = userProfile.Marriage;
        result.msg.weight = userProfile.Weight;
        result.msg.height = userProfile.Height;
        result.msg.language = userProfile.Language;
    }
    
    if (Page == 2){
        result.msg.NonDomesticExp = userProfile.NonDomesticExp;
        result.msg.DomesticExp = userProfile.DomesticExp;
        result.msg.Duties = userProfile.Duties;
        result.msg.Skills = userProfile.Skills;
    }

    if (Page == 3){
        result.msg.Priority = userProfile.Priority;
        result.msg.Info = userProfile.Info;
    }

    if (Page == 4){
        result.msg.Doc1 = userProfile.Doc1;
        result.msg.Doc2 = userProfile.Doc2;
        result.msg.Doc3 = userProfile.Doc3;
        result.msg.Doc4 = userProfile.Doc4;
        result.msg.Doc5 = userProfile.Doc5;
    }

    if (Page == 5){
        result.msg.Declaration = userProfile.Declaration;
    }

    else{
        result.msg = userProfile;
    }
    
    return result;
}

async function AddPost(UID, Title, ContractStatus, Skills, Holiday, Address, Location, Salary, UnitSize, OtherMaid, Overseas, ShareBed, Accommodation, Language, FirstDay, Deadline, Description, Gender, Experience){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const targetUser = dataManager.accountMap[UID];

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        console.log("1");
        return result;
    }

    if(!targetUser){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        console.log("2");
        return result;
    }

    if (Skills == [] || ContractStatus == [] || Holiday == null){
        result.msg = "Post Form is not completed.";
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        console.log("3");
        return result;
    }

    if(dataManager.blacklistByAcctUID[targetUser.UID]){
        DebugUtility.ErrorLog(`${targetUser.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[targetUser.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const schema = Joi.object({
        Title: Joi.string().required(),
        ContractStatus: Joi.array().required(),
        Skills: Joi.array().required(),
        Holiday: Joi.number().required(),
        Location: Joi.number().required(),
        Salary: Joi.number().required(),
        UnitSize: Joi.number().required(), 
        OtherMaid: Joi.boolean().required(),
        Overseas: Joi.boolean().required(),
        ShareBed: Joi.boolean().required(),
        Accommodation: Joi.boolean().required(),
        Language: Joi.number().required(),
        FirstDay: Joi.number().required(),
        Deadline: Joi.number().required(),
        Description: Joi.string().required(),
        Address: Joi.array().required(),
        Gender: Joi.string().required(),
        Experience: Joi.string().required(),
    });

    var validateResult = schema.validate({Title: Title, ContractStatus: ContractStatus, Skills: Skills, Holiday: Holiday, Location: Location, Salary: Salary, UnitSize: UnitSize, OtherMaid: OtherMaid, Overseas: Overseas, ShareBed: ShareBed, Accommodation: Accommodation, Language: Language, FirstDay: FirstDay, Deadline: Deadline, Description: Description, Address: Address, Gender: Gender, Experience: Experience});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        console.log(validateResult.error);
        return result;
    }

    //enum for contract status
    var contractObj = [false, false, false, false, false, false];
    if (ContractStatus.find(function(item){return item === "FirstTimeOversea"})) contractObj[0] =true;
    if (ContractStatus.find(function(item){return item === "ExHK"})) contractObj[1] =true;
    if (ContractStatus.find(function(item){return item === "Ex-Oversea"})) contractObj[2] =true;
    if (ContractStatus.find(function(item){return item === "FinishContract"})) contractObj[3] =true;
    if (ContractStatus.find(function(item){return item === "FinishedContractWithSpecialReason"})) contractObj[4] =true;
    if (ContractStatus.find(function(item){return item === "TerminatedOrBreakContract"})) contractObj[5] =true;  
    

    var skillsObj = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    if (Skills.find(function(item){return item === "ChineseFood"})) skillsObj[0] =true;
    if (Skills.find(function(item){return item === "WesternFood"})) skillsObj[1] =true;
    if (Skills.find(function(item){return item === "CareNewBorn"})) skillsObj[2] =true;
    if (Skills.find(function(item){return item === "CareToddlers"})) skillsObj[3] =true;
    if (Skills.find(function(item){return item === "CareKids"})) skillsObj[4] =true;
    if (Skills.find(function(item){return item === "CareElderly"})) skillsObj[5] =true;
    if (Skills.find(function(item){return item === "CareDisable"})) skillsObj[6] =true;
    if (Skills.find(function(item){return item === "PetCare"})) skillsObj[7] =true;
    if (Skills.find(function(item){return item === "Gardening"})) skillsObj[8] =true;
    if (Skills.find(function(item){return item === "Marketing"})) skillsObj[9] =true;
    if (Skills.find(function(item){return item === "CarWashing"})) skillsObj[10] =true;
    if (Skills.find(function(item){return item === "Housekeeping"})) skillsObj[11] =true;
    if (Skills.find(function(item){return item === "TutoringChildren"})) skillsObj[12] =true;
    if (Skills.find(function(item){return item === "Driving"})) skillsObj[13] =true;
    if (Skills.find(function(item){return item === "Cooking"})) skillsObj[14] =true;

    //enum for holiday
    // var holidayObj = [false, false, false];
    // if (Holiday.find(function(item){return item === 0})) holidayObj[0] =true;
    // if (Holiday.find(function(item){return item === 1})) holidayObj[1] =true;
    // if (Holiday.find(function(item){return item === 2})) holidayObj[2] =true;

    var newPost = new databaseManager.PostModel();
    newPost.OwnerUID = UID;
    newPost.UID = dataManager.GetPostUID();
    newPost.Title = Title;
    newPost.ContractStatus = contractObj;
    newPost.Gender = Gender;
    newPost.Experience = Experience;
    newPost.Skills = skillsObj;
    newPost.Holiday = Holiday;
    newPost.Location = Location;
    newPost.Salary = Salary;
    newPost.UnitSize = UnitSize;
    newPost.OtherMaid = OtherMaid;
    newPost.Overseas = Overseas;
    newPost.ShareBed = ShareBed;
    newPost.Accommodation = Accommodation;
    newPost.Language = Language;
    newPost.FirstDay = FirstDay;
    newPost.Deadline = Deadline;
    newPost.Description = Description;
    newPost.Address = Address;
    newPost.Status = 0;
    

    //set expire time
    var expireDate = new Date();
    newPost.ExpiredTime = expireDate.setUTCMonth(3);


    newPost.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.AddNewPost(newPost);
    });
    
    console.log(`User[${targetUser.Email}] created Post[${newPost.UID}]`);
    return result;
}

async function EditPost(UID, Title, ContractStatus, Skills, Holiday, Location, Salary, UnitSize, OtherMaid, Overseas, ShareBed, Accommodation, Language, FirstDay, Deadline, Description, Address, Gender, Experience){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const targetPost = dataManager.postMap[UID];

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        console.log("1");
        return result;
    }

    if(!targetPost){
        result.msg = "Post Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        console.log("2");
        return result;
    }

    if (Skills == [] || ContractStatus == [] || Holiday == null){
        result.msg = "Post Form is not completed.";
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        console.log("3");
        return result;
    }

    if(dataManager.blacklistByAcctUID[targetPost.OwnerUID]){
        DebugUtility.ErrorLog(`${targetPost.OwnerUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[targetPost.OwnerUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        console.log("4");
        return result;
    }    

    const schema = Joi.object({
        Title: Joi.string().required(),
        ContractStatus: Joi.array().required(),
        Skills: Joi.array().required(),
        Holiday: Joi.number().required(),
        Address: Joi.array().required(),
        Location: Joi.number().required(),
        Salary: Joi.number().required(),
        UnitSize: Joi.number().required(), 
        OtherMaid: Joi.boolean().required(),
        Overseas: Joi.boolean().required(),
        ShareBed: Joi.boolean().required(),
        Accommodation: Joi.boolean().required(),
        Language: Joi.number().required(),
        FirstDay: Joi.number().required(),
        Deadline: Joi.number().required(),
        Description: Joi.string().required(),
        Gender: Joi.string().required(),
        Experience: Joi.string().required(),
    });

    var validateResult = schema.validate({Title: Title, ContractStatus: ContractStatus, Skills: Skills, Holiday: Holiday, Address: Address, Location: Location, Salary: Salary, UnitSize: UnitSize, OtherMaid: OtherMaid, Overseas: Overseas, ShareBed: ShareBed, Accommodation: Accommodation, Language: Language, FirstDay: FirstDay, Deadline: Deadline, Description: Description, Address: Address, Gender:Gender, Experience: Experience});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        console.log(validateResult.error);
        return result;
    }

    //enum for contract status
    var contractObj = [false, false, false, false, false, false];
    if (ContractStatus.find(function(item){return item === "FirstTimeOversea"})) contractObj[0] =true;
    if (ContractStatus.find(function(item){return item === "ExHK"})) contractObj[1] =true;
    if (ContractStatus.find(function(item){return item === "Ex-Oversea"})) contractObj[2] =true;
    if (ContractStatus.find(function(item){return item === "FinishContract"})) contractObj[3] =true;
    if (ContractStatus.find(function(item){return item === "FinishedContractWithSpecialReason"})) contractObj[4] =true;
    if (ContractStatus.find(function(item){return item === "TerminatedOrBreakContract"})) contractObj[5] =true;

    //enum for skills
    var skillsObj = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    if (Skills.find(function(item){return item === "ChineseFood"})) skillsObj[0] =true;
    if (Skills.find(function(item){return item === "WesternFood"})) skillsObj[1] =true;
    if (Skills.find(function(item){return item === "CareNewBorn"})) skillsObj[2] =true;
    if (Skills.find(function(item){return item === "CareToddlers"})) skillsObj[3] =true;
    if (Skills.find(function(item){return item === "CareKids"})) skillsObj[4] =true;
    if (Skills.find(function(item){return item === "CareElderly"})) skillsObj[5] =true;
    if (Skills.find(function(item){return item === "CareDisable"})) skillsObj[6] =true;
    if (Skills.find(function(item){return item === "PetCare"})) skillsObj[7] =true;
    if (Skills.find(function(item){return item === "Gardening"})) skillsObj[8] =true;
    if (Skills.find(function(item){return item === "Marketing"})) skillsObj[9] =true;
    if (Skills.find(function(item){return item === "CarWashing"})) skillsObj[10] =true;
    if (Skills.find(function(item){return item === "Housekeeping"})) skillsObj[11] =true;
    if (Skills.find(function(item){return item === "TutoringChildren"})) skillsObj[12] =true;
    if (Skills.find(function(item){return item === "Driving"})) skillsObj[13] =true;
    if (Skills.find(function(item){return item === "Cooking"})) skillsObj[14] =true;

    //enum for contract status
    // var holidayObj = [false, false, false];
    // if (Holiday.find(function(item){return item === "Saturday"})) holidayObj[0] =true;
    // if (Holiday.find(function(item){return item === "Sunday"})) holidayObj[1] =true;
    // if (Holiday.find(function(item){return item === "Flexible"})) holidayObj[2] =true;

    
    targetPost.Title = Title;
    targetPost.ContractStatus = contractObj;
    targetPost.Skills = skillsObj;
    targetPost.Holiday = Holiday;
    targetPost.Address = Address;
    targetPost.Location = Location;
    targetPost.Salary = Salary;
    targetPost.UnitSize = UnitSize;
    targetPost.OtherMaid = OtherMaid;
    targetPost.Overseas = Overseas;
    targetPost.ShareBed = ShareBed;
    targetPost.Accommodation = Accommodation;
    targetPost.Language = Language;
    targetPost.FirstDay = FirstDay;
    targetPost.Deadline = Deadline;
    targetPost.Description = Description;
    targetPost.Address = Address;
    targetPost.Gender = Gender;
    targetPost.Experience = Experience;
    //set expire time
    var expireDate = new Date();
    targetPost.ExpiredTime = expireDate.setUTCMonth(3);


    targetPost.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdatePost(targetPost);
    });
    
    console.log(`User[${targetPost.OwnerUID}] updated Post[${targetPost.UID}]`);
    return result;
}

async function EditPostCMS(UID, Action, Field, Data){
    // (UID, Title, ContractStatus, Skills, Holiday, Address, Location, Salary, UnitSize, OtherMaid, Overseas, ShareBed, Accommodation, Language, FirstDay, Deadline, Description, Address)

    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const targetPost = dataManager.postMap[UID];

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

    if(!targetPost){
        result.msg = "Post Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    /*
    if (Skills == [] || ContractStatus == [] || Holiday == []){
        result.msg = "Post Form is not completed.";
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }
    */

    if(Action == 1)
    {
        if(Field=="title"){
            const schema = Joi.object({
                Title: Joi.string().max(100).required()
            })

            var validateResult = schema.validate({Title: Data})
            if(validateResult.error){
                result.msg = validateResult.error;
                result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
                result.responseStatus = 400;
                return result;
            }

            targetPost.Title = Data;

            targetPost.save((err,result)=>{
                if(err) DebugUtility.ErrorLog(err);
                dataManager.UpdatePost(targetPost);
            });
            
            console.log(`Admin updated Post[${targetPost.UID}]`);
            return result;
        }
    }
    /*
    const schema = Joi.object({
        Title: Joi.string().max(100).required(),
        ContractStatus: Joi.array().required(),
        Skills: Joi.array().required(),
        Holiday: Joi.array().required(),
        Address: Joi.array().required(),
        Location: Joi.number().required(),
        Salary: Joi.number().required(),
        UnitSize: Joi.number().required(), 
        OtherMaid: Joi.boolean().required(),
        Overseas: Joi.boolean().required(),
        ShareBed: Joi.boolean().required(),
        Accommodation: Joi.boolean().required(),
        Language: Joi.number().required(),
        FirstDay: Joi.number().required(),
        Deadline: Joi.number().required(),
        Description: Joi.string().max(500).required(),
        Address: Joi.array().required()
    });

    var validateResult = schema.validate({Title: Title, ContractStatus: ContractStatus, Skills: Skills, Holiday: Holiday, Address: Address, Location: Location, Salary: Salary, UnitSize: UnitSize, OtherMaid: OtherMaid, Overseas: Overseas, ShareBed: ShareBed, Accommodation: Accommodation, Language: Language, FirstDay: FirstDay, Deadline: Deadline, Description: Description, Address: Address});

    if(validateResult.error){
        result.msg = validateResult.error;
        result.errorCode = CommonUtility.ErrorCode.ResetPassword_PasswordFormatInvalid;
        result.responseStatus = 400;
        return result;
    }

    //enum for contract status
    var contractObj = [false, false, false, false, false, false];
    if (ContractStatus.find(function(item){return item === "FirstTimeOversea"})) contractObj[0] =true;
    if (ContractStatus.find(function(item){return item === "ExHK"})) contractObj[1] =true;
    if (ContractStatus.find(function(item){return item === "Ex-Oversea"})) contractObj[2] =true;
    if (ContractStatus.find(function(item){return item === "FinishContract"})) contractObj[3] =true;
    if (ContractStatus.find(function(item){return item === "FinishedContractWithSpecialReason"})) contractObj[4] =true;
    if (ContractStatus.find(function(item){return item === "TerminatedOrBreakContract"})) contractObj[5] =true;

    //enum for skills
        var skillsObj = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    if (Skills.find(function(item){return item === "ChineseFood"})) skillsObj[0] =true;
    if (Skills.find(function(item){return item === "WesternFood"})) skillsObj[1] =true;
    if (Skills.find(function(item){return item === "CareNewBorn"})) skillsObj[2] =true;
    if (Skills.find(function(item){return item === "CareToddlers"})) skillsObj[3] =true;
    if (Skills.find(function(item){return item === "CareKids"})) skillsObj[4] =true;
    if (Skills.find(function(item){return item === "CareElderly"})) skillsObj[5] =true;
    if (Skills.find(function(item){return item === "CareDisable"})) skillsObj[6] =true;
    if (Skills.find(function(item){return item === "PetCare"})) skillsObj[7] =true;
    if (Skills.find(function(item){return item === "Gardening"})) skillsObj[8] =true;
    if (Skills.find(function(item){return item === "Marketing"})) skillsObj[9] =true;
    if (Skills.find(function(item){return item === "CarWashing"})) skillsObj[10] =true;
    if (Skills.find(function(item){return item === "Housekeeping"})) skillsObj[11] =true;
    if (Skills.find(function(item){return item === "TutoringChildren"})) skillsObj[12] =true;
    if (Skills.find(function(item){return item === "Driving"})) skillsObj[13] =true;
    if (Skills.find(function(item){return item === "Cooking"})) skillsObj[14] =true;

    //enum for contract status
    var holidayObj = [false, false, false];
    if (Holiday.find(function(item){return item === "Saturday"})) holidayObj[0] =true;
    if (Holiday.find(function(item){return item === "Sunday"})) holidayObj[1] =true;
    if (Holiday.find(function(item){return item === "Flexible"})) holidayObj[2] =true;

    
    targetPost.Title = Title;
    targetPost.ContractStatus = contractObj;
    targetPost.Skills = skillsObj;
    targetPost.Holiday = holidayObj;
    targetPost.Address = Address;
    targetPost.Location = Location;
    targetPost.Salary = Salary;
    targetPost.UnitSize = UnitSize;
    targetPost.OtherMaid = OtherMaid;
    targetPost.Overseas = Overseas;
    targetPost.ShareBed = ShareBed;
    targetPost.Accommodation = Accommodation;
    targetPost.Language = Language;
    targetPost.FirstDay = FirstDay;
    targetPost.Deadline = Deadline;
    targetPost.Description = Description;
    targetPost.Address = Address;
    //set expire time
    var expireDate = new Date();
    targetPost.ExpiredTime = expireDate.setUTCMonth(3);


    targetPost.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        dataManager.UpdatePost(targetPost);
    });
    
    console.log(`User[${targetPost.OwnerUID}] updated Post[${targetPost.UID}]`);
    return result;
    */
}

async function DeletePost(UID){
    var result = { responseStatus: 200, errorCode: 0,  msg: ""};

    //check features is on or not
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.ForgetPassword].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }

       

    for(let i = 0; i < UID.length ; i++){
        const targetPost = dataManager.postMap[UID[i]]

        if(dataManager.blacklistByAcctUID[targetPost.OwnerUID]){
            DebugUtility.ErrorLog(`${targetPost.OwnerUID} is on the blacklistByIP`);
            result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
            result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
            result.responseStatus = 400;  
            return result; 
        }
    
        //check is target on the blacklistByIP
        const clientDevice = dataManager.clientDeviceMapByOwner[targetPost.OwnerUID];
    
        if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
            DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
            result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
            result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
            result.responseStatus = 400;
            return result;
        }

        if(!targetPost){
            result.msg = result.msg + `Post ${UID[1]} Not Found;`
            result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
            result.responseStatus = 400;
            // return result;
        } else {
            targetPost.delete((err,result)=>{
                if(err) return console.error(err);
                dataManager.DeletePost(targetPost);
            })
        }

    }    

    return result;
}

async function RecallProfile(AcctUID){
    var result = {responseStatus: 200, errorCode: 0, msg:{}};
    //Retrieve Data
    const targetProfile = dataManager.profileMapByOwner[AcctUID];

    if(!targetProfile){
        result.msg = "Your Token is Expired or Not Found!"
        result.errorCode = CommonUtility.ErrorCode.VerifyLinkIsExpired;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[targetProfile.OwnerUID]){
        DebugUtility.ErrorLog(`${targetProfile.OwnerUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    if(targetProfile.Status != -1 && targetProfile.Status != 5) {
        targetProfile.Status = 5;
        result.msg = "Profile Recalled."
    }
    else if(targetProfile.Status == 5) {
        targetProfile.Status = 0;
        result.msg = "Profile Pending."
    }
    else {
        return result = {responseStatus:400, msg: "unexpected error"};
    }

    await targetProfile.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(targetProfile);
    })

    return result;
}

async function LikeHelper(AcctUID, TargetUID){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const UserProf = dataManager.profileMap[AcctUID];
    const HelperProf = dataManager.profileMap[TargetUID];

    if(!UserProf){
        result.msg = "Invaild Account!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(!HelperProf){
        result.msg = "Invaild Post!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[AcctUID]){
        DebugUtility.ErrorLog(`${AcctUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[AcctUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }
    

    const chkShortList = UserProf.ShortList.find(element => element === HelperProf.UID)
    const chkFavoritedBy = HelperProf.FavoritedBy.find(element => element === UserProf.OwnerUID);
    console.log(chkShortList);
    console.log(chkFavoritedBy);

    if (!chkShortList){
        UserProf.ShortList.push(HelperProf.UID)  
    } else {
        UserProf.ShortList = UserProf.ShortList.filter(item => item !== HelperProf.UID);
    }
    
    if (!chkFavoritedBy){
        HelperProf.FavoritedBy.push(UserProf.OwnerUID);
    } else {
        HelperProf.FavoritedBy = HelperProf.FavoritedBy.filter(item => item !== UserProf.OwnerUID)
    }

    await UserProf.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(UserProf);
    })

    await HelperProf.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(HelperProf);
    })

    return result;
}

async function HireHelper(AcctUID, TargetUID, Language){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const UserProf = dataManager.profileMap[AcctUID];
    const HelperProf = dataManager.profileMap[TargetUID];

    if(!UserProf){
        result.msg = "Invaild Account!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(!HelperProf){
        result.msg = "Invaild Post!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[AcctUID]){
        DebugUtility.ErrorLog(`${AcctUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[AcctUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const chkApplying = UserProf.Applying.find(element => element === HelperProf.UID)
    const chkAppliedBy = HelperProf.AppliedBy.find(element => element === UserProf.OwnerUID);

    dataManager.appliedHelper.push(HelperProf);

    console.log(chkApplying);
    console.log(chkAppliedBy);

    if (!chkApplying){
        UserProf.Applying.push(HelperProf.UID)
    } 
    
    if (!chkAppliedBy){
        HelperProf.AppliedBy.push(UserProf.OwnerUID);
    } 
    
    HelperProf.AppliedTime = Date.now();

    const postList = dataManager.postMapByOwnerUID[UserProf.UID];
    if(postList){
        const appliedRelatedPost = postList.find(element => element.AppliedBy.includes(HelperProf.UID));
        if(appliedRelatedPost){
            DebugUtility.DebugLog(`${AcctUID} is already applying for ${TargetUID}`);
            var employerAcct = dataManager.accountMap[UserProf.OwnerUID];
            var employeeAcct = dataManager.accountMap[HelperProf.OwnerUID];
            var data = {
                employerData: {Acct: employerAcct, Profile: UserProf}, 
                employeeData: {Acct: employeeAcct, Profile: HelperProf}
            };
            dataManager.applyEachOther.push(data);
        }   
    }
    


    await UserProf.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(UserProf);
    })

    await HelperProf.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(HelperProf);
    })

    if(Language == 'HK'){
        const original = dataManager.localizationMap["999998"].LangHK;
        const replacedTitle = original.replace('${Name}', HelperProf.FirstName+" "+HelperProf.LastName);
        const replacedAll = replacedTitle.replace('${UID}', HelperProf.UID);

        const CSPhone = dataManager.localizationMap["999995"].LangHK;
        result.msg = `https://wa.me/${CSPhone}?text=`+encodeURIComponent(replacedAll.trim())
    }

    else if(Language == "ID"){
        const original = dataManager.localizationMap["999998"].LangID;
        const replacedTitle = original.replace('${Name}', HelperProf.FirstName+" "+HelperProf.LastName);
        const replacedAll = replacedTitle.replace('${UID}', HelperProf.UID);

        const CSPhone = dataManager.localizationMap["999995"].LangID;
        result.msg = `https://wa.me/${CSPhone}?text=`+encodeURIComponent(replacedAll.trim())
    }

    else{
        const original = dataManager.localizationMap["999998"].LangEN;
        const replacedTitle = original.replace('${Name}', HelperProf.FirstName+" "+HelperProf.LastName);
        const replacedAll = replacedTitle.replace('${UID}', HelperProf.UID);

        const CSPhone = dataManager.localizationMap["999995"].LangEN;
        result.msg = `https://wa.me/${CSPhone}?text=`+encodeURIComponent(replacedAll.trim())
    }

    console.log(result.msg);
    return result;
}

async function LikePost(AcctUID, TargetUID){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const UserProf = dataManager.profileMap[AcctUID];
    const TargetPost = dataManager.postMap[TargetUID];

    if(!UserProf){
        result.msg = "Invaild Account!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(!TargetPost){
        result.msg = "Invaild Post!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[AcctUID]){
        DebugUtility.ErrorLog(`${AcctUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[AcctUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const chkShortList = UserProf.ShortList.find(element => element === TargetPost.UID)
    const chkFavoritedBy = TargetPost.FavoritedBy.find(element => element === UserProf.OwnerUID);

    console.log(chkShortList);
    console.log(chkFavoritedBy);
    if (!chkShortList){
        UserProf.ShortList.push(TargetPost.UID);    
    } else {
        UserProf.ShortList = UserProf.ShortList.filter(item => item !== TargetPost.UID);
    }
    
    if (!chkFavoritedBy){
        TargetPost.FavoritedBy.push(UserProf.OwnerUID);
    } else {
        TargetPost.FavoritedBy = TargetPost.FavoritedBy.filter(item => item !== UserProf.OwnerUID)
    }

    await UserProf.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(UserProf);
    })

    await TargetPost.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(TargetPost);
    })

    return result;
}

async function ApplyPost(AcctUID, TargetUID, Language){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    //Retrieve Data
    const UserProf = dataManager.profileMapByOwner[AcctUID];
    const TargetPost = dataManager.postMap[TargetUID];

    if(!UserProf){
        result.msg = "Invaild Account!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(!TargetPost){
        result.msg = "Invaild Post!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        return result;
    }

    if(dataManager.blacklistByAcctUID[AcctUID]){
        DebugUtility.ErrorLog(`${AcctUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[AcctUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    const chkApplying = UserProf.Applying.find(element => element === TargetPost.UID)
    const chkAppliedBy = TargetPost.AppliedBy.find(element => element === UserProf.OwnerUID);

    dataManager.appliedPost.push(TargetPost);
    /*
    if(dataManager.appliedPost.length > 10){
        dataManager.appliedPost.shift();
    }
    */
   
    console.log(chkApplying);
    console.log(chkAppliedBy);
    if (!chkApplying){
        UserProf.Applying.push(TargetPost.UID);    
    } 
    
    if (!chkAppliedBy){
        TargetPost.AppliedBy.push(UserProf.OwnerUID);
    } 

    TargetPost.AppliedTime = Date.now();
    
    const employeeProf = dataManager.profileMap[TargetPost.OwnerUID];
    if(employeeProf){
        const appliedRelatedEmployer = employeeProf.Applying.find(element => element === UserProf.OwnerUID)
        if(appliedRelatedEmployer){
            const postOwnerProfile = dataManager.profileMap[TargetPost.OwnerUID];
            var employerAcct = dataManager.accountMap[postOwnerProfile.OwnerUID];
            var employeeAcct = dataManager.accountMap[UserProf.OwnerUID];
            var data = {
                employerData: {Acct: employerAcct, Profile: postOwnerProfile}, 
                employeeData: {Acct: employeeAcct, Profile: UserProf}
            };
            dataManager.applyEachOther.push(data);
        }
    }

    await UserProf.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(UserProf);
    })

    await TargetPost.save((err,result)=>{
        if(err) return console.error(err);
        dataManager.UpdateProfile(TargetPost);
    })

    if(Language == 'HK'){
        const original = dataManager.localizationMap["999999"].LangHK;
        const replacedTitle = original.replace('${Title}', TargetPost.Title);
        const replacedAll = replacedTitle.replace('${UID}', TargetPost.UID);

        const CSPhone = dataManager.localizationMap["999995"].LangHK;
        result.msg = `https://wa.me/${CSPhone}?text=`+encodeURIComponent(replacedAll.trim())
    }

    else if(Language == "ID"){
        const original = dataManager.localizationMap["999999"].LangID;
        const replacedTitle = original.replace('${Title}', TargetPost.Title);
        const replacedAll = replacedTitle.replace('${UID}', TargetPost.UID);

        const CSPhone = dataManager.localizationMap["999995"].LangID;
        result.msg = `https://wa.me/${CSPhone}?text=`+encodeURIComponent(replacedAll.trim())
    }

    else{
        const original = dataManager.localizationMap["999999"].LangEN;
        const replacedTitle = original.replace('${Title}', TargetPost.Title);
        const replacedAll = replacedTitle.replace('${UID}', TargetPost.UID);

        const CSPhone = dataManager.localizationMap["999995"].LangEN;
        result.msg = `https://wa.me/${CSPhone}?text=`+encodeURIComponent(replacedAll.trim())
    }

    console.log(result.msg);
    return result;
}



async function UploadFile(AcctUID, contents, body){
    var result = { responseStatus: 200, errorCode: 0,  msg: []};
    //Retrieve Data
    const targetUser = dataManager.accountMap[AcctUID];

    //check features is on or not
    /*
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.UploadFile].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }
    */
    if(!targetUser){
        result.msg = "Invaild Account!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        console.log("No targetUser, "+ AcctUID);
        return result;
    }

    if(dataManager.blacklistByAcctUID[AcctUID]){
        DebugUtility.ErrorLog(`${AcctUID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        console.log("2");
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[AcctUID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        console.log("3");
        return result;
    }

    
    // if(contents == null) {
    //     console.log("no image");
    //     result.responseStatus = 204;
    //     result.msg = "no image"
    //     return result;
    // }
    // else{
        
    //     var newPath = "./client/public/uploads/"+targetUser.UID+contents.image.name;
    //     console.log(newPath);
    //     result.msg = newPath;
    //     fs.writeFile(newPath, contents.image.data , err=>{})
    // }
    // targetProfile.AvatarIconPath = newPath;
    
    
    // targetProfile.save((err,result)=>{
    //     if(err) DebugUtility.ErrorLog(err);
    //     dataManager.UpdateProfile(targetProfile);
    // });
    
    const targetProfile = dataManager.profileMapByOwner[AcctUID];
    // DebugUtility.WarningLog(`B4 change profile: ${targetProfile}`)
    var isChange = false;
    if(contents != null) var haveFiles = true;
    else var haveFiles = false;

    if(body.Avatar == ''){
        targetProfile.AvatarIconPath = "";
    }else{
        if(haveFiles){
            if(contents.Avatar != null){
                isChange = true
                //path.normalize(CommonUtility.DirectoryPath.upload + targetUser.UID + "/" + files.filetoupload.originalFilename);
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.Avatar.name;
                // console.log(newPath);
                result.msg.push(newPath);
                fs.writeFile(newPath, contents.Avatar.data , err=>{})
                targetProfile.AvatarIconPath = newPath.slice(1);
            }    
        }
    }
    
    if(targetProfile.Pics == [] || targetProfile.Pics == null){ targetProfile.Pics = ['','','','']; }
    if(targetProfile.Doc == [] || targetProfile.Doc == null){ targetProfile.Doc = ['','','','','','','','','','']; }
    
    if(body.profile1 == ''){
        targetProfile.Pics[0] = ''
    }else{
        if(haveFiles){
            if(contents.profile1 != null){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.profile1.name;
                // console.log(newPath);
                fs.writeFile(newPath, contents.profile1.data , err=>{})
                targetProfile.Pics[0] = newPath.slice(1);
            }
        }     
    }
    
    if(body.profile2 == ''){
        targetProfile.Pics[1] = ''
    }else{
        if(haveFiles){
            if(contents.profile2 != null){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.profile2.name;
                // console.log(newPath);
                fs.writeFile(newPath, contents.profile2.data , err=>{})
                targetProfile.Pics[1] = newPath.slice(1);
            }
        }
    }
    
    if(body.profile3 == ''){
        targetProfile.Pics[2] = ''
    }else{
        if(haveFiles){
            if(contents.profile3 != null){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.profile3.name;
                // console.log(newPath);
                fs.writeFile(newPath, contents.profile3.data , err=>{})
                targetProfile.Pics[2] = newPath.slice(1);
            }
        }
    }
    
    if(body.profile4 == ''){
        targetProfile.Pics[3] = ''
    }else{
        if(haveFiles){
            if(contents.profile4 != null){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.profile4.name;
                // console.log(newPath);
                fs.writeFile(newPath, contents.profile4.data , err=>{})
                targetProfile.Pics[3] = newPath.slice(1);
            }
        }
    }
    
    //if(targetProfile.Doc == null) { targetProfile.Doc = []; }
    if(body.doc1 == ''){
        targetProfile.Doc[0] = '';
        targetProfile.Doc[1] = '';
    }else{
        if(haveFiles && contents.doc1 != null){
            if(body.description1!=''){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.doc1.name;
                fs.writeFile(newPath, contents.doc1.data , err=>{})

                if(newPath)
                    targetProfile.Doc[0] = newPath.slice(1);
                if(body.description1)
                    targetProfile.Doc[1] = body.description1;
                
            } else {
                result.msg.push("Document1's Description Missing")
            }
        }
        else targetProfile.Doc[1] = body.description1;
    }
    
    if(body.doc2 == ''){
        targetProfile.Doc[2] = '';
        targetProfile.Doc[3] = '';
    }else{
        if(haveFiles && contents.doc2 != null){
            if(body.description2!=''){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.doc2.name;
                fs.writeFile(newPath, contents.doc2.data , err=>{})
                if(newPath)
                    targetProfile.Doc[2] = newPath.slice(1);
                if(body.description2)
                    targetProfile.Doc[3] = body.description2;
            } else {
                result.msg.push("Document2's Description Missing")
            }
        }
        else targetProfile.Doc[3] = body.description2;
    }
    if(body.doc3 == ''){
        targetProfile.Doc[4] = '';
        targetProfile.Doc[5] = '';
    }else{
        if(haveFiles && contents.doc3 != null){
            if(body.description3!=''){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.doc3.name;
                fs.writeFile(newPath, contents.doc3.data , err=>{})
                if(newPath)
                    targetProfile.Doc[4] = newPath.slice(1);
                if(body.description3)
                    targetProfile.Doc[5] = body.description3;
            } else {
                result.msg.push("Document3's Description Missing")
            }        }       
        else targetProfile.Doc[5] = body.description3;
    }

    if(body.doc4 == ''){
        targetProfile.Doc[6] = '';
        targetProfile.Doc[7] = '';
    }else{
        if(haveFiles && contents.doc4 != null){
            if(body.description4!=''){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.doc4.name;
                fs.writeFile(newPath, contents.doc4.data , err=>{})

                if(newPath)
                    targetProfile.Doc[6] = newPath.slice(1);
                if(body.description4)
                    targetProfile.Doc[7] = body.description4;
            } else {
                result.msg.push("Document4's Description Missing")
            }
        }   
        else targetProfile.Doc[7] = body.description4;
    }

    if(body.doc5 == ''){
        targetProfile.Doc[8] = '';
        targetProfile.Doc[9] = '';
    }else{
        if(haveFiles && contents.doc5 != null){
            if(body.description5!=''){
                isChange = true
                var newPath = "./client/public/uploads/"+targetUser.UID+"_"+contents.doc5.name;
                fs.writeFile(newPath, contents.doc5.data , err=>{})

                if(newPath)
                    targetProfile.Doc[8] = newPath.slice(1);
                if(body.description5)
                    targetProfile.Doc[9] = body.description5;
            } else {
                result.msg.push("Document5's Description Missing")
            }
        }    
        else targetProfile.Doc[9] = body.description5;
    }
    
    //have callback it should be saved 
    targetProfile.markModified('Pics')
    targetProfile.markModified('Doc');
    await targetProfile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        //DebugUtility.WarningLog(`After Save: ${targetProfile}`);
        dataManager.UpdateProfile(targetProfile);
    });

    return result;
    
}

async function GetFile(path){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};

    fs.readFile(path, (err,data)=>{
        if(err) {
            result.msg = "file is not exist"
            result.responseStatus=400
            return 
        }
        else{
            result.msg = data;
            return
        }
    })
    return result;
}
//Msg Action
//=================================================================================================================
async function SendMsg(acctUID, toAcctUID, title, content){
    var result = { responseStatus: 200, errorCode: 0};

    //Retrieve Data
    const user = dataManager.onlineAccount[acctUID];
    const targetUser = dataManager.accountMap[toAcctUID];

    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.MsgSystem].isActive){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        return result;
    }

    if(!user){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        return result;
    }

    if(!targetUser){
        result.responseStatus = 406;
        result.errorCode = CommonUtility.ErrorCode.TargetAccountNotExists;
        return result;
    }

    var dateObj = new Date();
    dateObj.setFullYear(dateObj.getFullYear() + 1);

    var msg = databaseManager.MsgModel();
    msg.UID = dataManager.GetMsgUID();
    msg.OwnerUID = user.UID;
    msg.SenderUID = targetUser.UID;
    msg.Title = title;
    msg.Content = content;
    msg.Status = CommonUtility.MsgStatus.unread;
    msg.ExpiredTime = dateObj;
    msg.save((err, result)=>{
       if(err) DebugUtility.ErrorLog(err);
       dataManager.AddNewMsg(msg);
    }); 

    return result;
}

async function GetAllMsg(acctUID){
    var result = { responseStatus: 200, errorCode: 0, extraObj: {}};

    //Retrieve Data
    const user = dataManager.onlineAccount[acctUID];

    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.MsgSystem].isActive){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        return result;
    }

    if(!user){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        return result;
    }
    
    result.extraObj = dataManager.msgMapByOwnerUID[user.UID];
    return result;
}

async function GetMsg(acctUID, targetAcctUID){
    var result = { responseStatus: 200, errorCode: 0};

    //Retrieve Data
    const user = dataManager.onlineAccount[acctUID];
    const targetUser = dataManager.accountMap[toAcctUID];

    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.MsgSystem].isActive){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        return result;
    }

    if(!user){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        return result;
    }

    if(!targetUser){
        result.responseStatus = 406;
        result.errorCode = CommonUtility.ErrorCode.TargetAccountNotExists;
        return result;
    }
    

    return result;
}

//Mail Action
//=================================================================================================================
async function SendMail(acctUID, toAcctUID, title, content){

}

module.exports = {
    Login, Register, Logout, ForgetPassword, EmailVerify, ResetPassword, ResetMyPassword, ResetEmailVerifyToken, GetMyProfile, EditProfile, EditDetail1, EditDetail2, EditDetail3,  EditDetail5, GetDetail, AddPost, EditPost, EditPostCMS, DeletePost, UploadFile, LikeHelper, LikePost, HireHelper, ApplyPost, GetFile, RecallProfile
}

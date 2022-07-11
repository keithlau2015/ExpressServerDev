const bcrypt = require("bcryptjs");
const fs = require ('fs');

const DataManager = require('../DataManager');
const DatabaseManager = require('../DatabaseManager');
const CommonUtility = require('../Utils/CommonUtility');
const DebugUtility = require('../Utils/DebugUtility');
const FilterUtility = require('../Utils/Filter');
const { func } = require('joi');
const { is } = require("type-is");
const { profile } = require("console");
var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();

async function Blacklist(CMSAcct, action, targetAcctUID, Filter = null){
    var result = { responseStatus: 200, errorCode: 0, msg: {}};

    if(!CMSAcct){
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        result.msg = "Account not found";
        DebugUtility.ErrorLog("Account not found");
        return result;
    }

    if(CMSAcct.Authority < CommonUtility.UserTier.cmsStdUser){
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
        result.responseStatus = 400;
        result.msg = "Authority not enough";
        DebugUtility.ErrorLog("Authority not enough");
        return result;
    }

    if(dataManager.blacklistByAcctUID[CMSAcct.UID]){
        DebugUtility.ErrorLog(`${CMSAcct.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[CMSAcct.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    //Add To Black list
    if(action == 0){
        const targetAccount = dataManager.accountMap[targetAcctUID];
        if(!targetAccount){
            result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
            result.responseStatus = 400;
            result.msg = "Account not found";
            DebugUtility.ErrorLog("Account not found");
            return result;
        }
        const clientDevice = dataManager.clientDeviceMapByOwner[targetAccount.UID];

        if(!clientDevice){
            result.errorCode = CommonUtility.ErrorCode.TargetClientDeivceNotFound;
            result.responseStatus = 400;
            result.msg = "Target client device not found";
            DebugUtility.ErrorLog("Target client device not found");
            return result;
        }
    
        if(dataManager.blacklistByIP[clientDevice.IP]){
            result.errorCode = CommonUtility.ErrorCode.Blacklist_ReadyOnList;
            result.responseStatus = 400;
            result.msg = "Account is already on blacklistByIP";
            DebugUtility.ErrorLog("Account is already on blacklistByIP");
            return result;
        }
    
        dataManager.blacklistByIP[targetAccount.IP] = targetAccount;
    
        var newAccessControl = new databaseManager.AccessControllistModel();
        newAccessControl.AcctUID = targetAccount.UID;
        newAccessControl.IP = clientDevice.IP;
        newAccessControl.Type = CommonUtility.AccessControlType.blacklistByIP;
        await newAccessControl.save((err, result)=>{
            if(err) DebugUtility.ErrorLog(err);
        });

        return result;
    }
    else if(action == 1){
        const targetAccount = dataManager.accountMap[targetAcctUID];
        if(!targetAccount){
            result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
            result.responseStatus = 400;
            result.msg = "Account not found";
            DebugUtility.ErrorLog("Account not found");
            return result;
        }

        const clientDevice = dataManager.clientDeviceMapByOwner[targetAccount.UID];

        if(!clientDevice){
            result.errorCode = CommonUtility.ErrorCode.TargetClientDeivceNotFound;
            result.responseStatus = 400;
            result.msg = "Target client device not found";
            DebugUtility.ErrorLog("Target client device not found");
            return result;
        }
    
        if(!dataManager.blacklistByIP[targetAccount.IP]){
            result.errorCode = CommonUtility.ErrorCode.Blacklist_NotOnList;
            result.responseStatus = 400;
            result.msg = "Account is not on blacklistByIP";
            DebugUtility.ErrorLog("Account is not on blacklistByIP");
            return result;
        }
    
        var newAccessControl = dataManager.blacklistByIP[targetAccount.IP];
        await newAccessControl.delete((err, result) =>{
            if(err) DebugUtility.ErrorLog(err);
        });
        delete dataManager.blacklistByIP[targetAccount.IP];

        return result;
    }
    else if(action == 2){
        var blacklistByAcctUID = {};
        var filterObjList = {};
        if(Filter != null){
            //Expected Format: UID: >= 0
            for(const[key, value] of Object.entries(Filter)){     
                var meta = value.split(" ");
                filterObjList[key.toString()] = {Operator: meta[0], Value: meta[1]};
            }
        }

        //Only Retreive accounts lower than current user
        for(const[uid, accessControl] of Object.entries(dataManager.blacklistByAcctUID)){            
            var valid = false;
            var acct = dataManager.accountMap[accessControl.AcctUID];
            if(!acct) continue;

            if(acct.Authority <= CMSAcct.Authority){
                valid = true;
            }

            if(filterObjList != null && valid){
                for(const[f_key, f_value] of Object.entries(filterObjList)){
                    if(accessControl[f_key]){
                        valid = CommonUtility.ConditionChecker(f_value.Operator, accessControl[f_key], Number(f_value.Value));
                    }
                    else{
                        valid = false;
                    }
                }
            }
            if(valid){
                blacklistByAcctUID[accessControl.AcctUID] = accessControl;
                result.msg = blacklistByAcctUID;
            }
            else{
                result.msg = valid;
            }
        }
        
        if(result.msg == null || Object.keys(result.msg).length == 0){
            result.msg = false;
        }

        return result;
    }
    else if(action == 3){
        const targetAccount = dataManager.accountMap[targetAcctUID];
        if(!targetAccount){
            result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
            result.responseStatus = 400;
            result.msg = "Account not found";
            DebugUtility.ErrorLog("Account not found");
            return result;
        }
    
        if(dataManager.blacklistByAcctUID[targetAccount.UID]){
            result.errorCode = CommonUtility.ErrorCode.Blacklist_ReadyOnList;
            result.responseStatus = 400;
            result.msg = "Account is already on blacklistByAcctUID";
            DebugUtility.ErrorLog("Account is already on blacklistByAcctUID");
            return result;
        }

        const clientDevice = dataManager.clientDeviceMapByOwner[targetAccount.UID];

        if(!clientDevice){
            result.errorCode = CommonUtility.ErrorCode.TargetClientDeivceNotFound;
            result.responseStatus = 400;
            result.msg = "Target client device not found";
            DebugUtility.ErrorLog(`Target client device [${targetAcctUID}] not found`);
            return result;
        }
    
        var newAccessControl = new databaseManager.AccessControllistModel();
        newAccessControl.AcctUID = targetAccount.UID;
        newAccessControl.IP = clientDevice.IP;
        newAccessControl.Type = CommonUtility.AccessControlType.blacklistByAcctUID;
        await newAccessControl.save((err, result)=>{
            if(err) DebugUtility.ErrorLog(err);
        });

        // var targetProfile = dataManager.profileMapByOwner[targetAccount.UID];
        // if(targetProfile){
        //     targetProfile.Status = CommonUtility.status.OnBlacklist;
        //     targetProfile.markModified('Status');
        //     targetProfile.save((err, result)=>{
        //         if(err) DebugUtility.ErrorLog(err);
        //     });
        //     dataManager.UpdateProfile(targetProfile);
        // }

        dataManager.blacklistByAcctUID[targetAccount.UID] = newAccessControl;

        return result;
    }
    else if(action == 4){
        const targetAccount = dataManager.accountMap[targetAcctUID];
        if(!targetAccount){
            result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
            result.responseStatus = 400;
            result.msg = "Account not found";
            DebugUtility.ErrorLog(`Account ${targetAcctUID} not found`);
            return result;
        }
    
        if(!dataManager.blacklistByAcctUID[targetAccount.UID]){
            result.errorCode = CommonUtility.ErrorCode.Blacklist_ReadyOnList;
            result.responseStatus = 200;
            result.msg = "Account is not on blacklistByAcctUID";
            DebugUtility.ErrorLog(`Account ${targetAcctUID} is not on blacklistByAcctUID`);
            return result;
        }
    
        var newAccessControl = dataManager.blacklistByAcctUID[targetAccount.UID];
        await newAccessControl.delete((err, result) =>{
            if(err) DebugUtility.ErrorLog(err);
        });

        // var targetProfile = dataManager.profileMapByOwner[targetAccount.UID];
        // if(targetProfile){
        //     targetProfile.Status = CommonUtility.status.None;
        //     targetProfile.markModified('Status');
        //     targetProfile.save((err, result)=>{
        //         if(err) DebugUtility.ErrorLog(err);
        //     });
        //     dataManager.UpdateProfile(targetProfile);
        // }

        delete dataManager.blacklistByAcctUID[targetAccount.UID];

        return result;
    }
    else{
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.ActionUnknown;
        result.msg = "Action unknown";
        return result;
    }
}

async function fileUpload(){
    
}
async function CRUD(CmsUser, TargetDB, Action, TargetUID, Data ,Filter = null, Files = null){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    if(!CmsUser){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        DebugUtility.ErrorLog("CMS Error: " + result.errorCode)
        return result;
    }

    // var onlineUser = dataManager.onlineAccount[CmsUser.UID];
    // if(!onlineUser){
    //     result.responseStatus = 400;
    //     result.errorCode = CommonUtility.ErrorCode.AccessDenied_NotYetLogin;
    //     DebugUtility.ErrorLog("CMS Error: " + result.errorCode)
    //     return result;
    // }

    if(CmsUser.Authority < CommonUtility.UserTier.cmsStdUser){
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
        DebugUtility.ErrorLog("CMS Error: " + result.errorCode)
        return result;
    }
    
    if(dataManager.blacklistByAcctUID[CmsUser.UID]){
        DebugUtility.ErrorLog(`${CmsUser.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[CmsUser.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    //#region System Data
    if (TargetDB == "account"){
        if(Action == "read"){
            var accts = {};
            var filterObjList = {};
            if(Filter != null){
                //Expected Format: UID: >= 0
                for(const[key, value] of Object.entries(Filter)){     
                    var meta = value.split(" ");
                    //DebugUtility.DebugLog("Properties: " + key.toString() + " ,meta[0]: " + meta[0] + " ,meta[1]:" + meta[1]);
                    filterObjList[key.toString()] = {Operator: meta[0], Value: meta[1]};
                }
            }

            //Only Retreive accounts lower than current user
            for(const[acctUID, acct] of Object.entries(dataManager.accountMap)){
                var valid = false;

                if(!acct) continue;

                if(acct.Authority <= CmsUser.Authority){
                    valid = true;
                }

                if(filterObjList != null && valid){
                    //DebugUtility.DebugLog(`Checking => UID: ${acctUID}, acct.Authority: ${acct.Authority}`);
                    for(const[f_key, f_value] of Object.entries(filterObjList)){
                        if(acct[f_key]){
                            valid = CommonUtility.ConditionChecker(f_value.Operator, acct[f_key], Number(f_value.Value));
                        }
                        else{
                            valid = false;
                        }
                    }
                }
                
                if(valid){
                    accts[acct.UID] = acct;
                }
            }
            
            result.msg = accts;
            return result;
        }        
        else if(Action == "add"){
            if(Data.Authority > CmsUser.Authority){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
                result.msg = "You can't create account with higher authority than your own";
                return result;
            }

            var newAcct = new databaseManager.AccountModel();
            newAcct.UID = dataManager.GetAccountUID();            
            newAcct.Authority = Data.Authority;
            newAcct.Email = Data.Email;
            const hashedPassword = await bcrypt.hash(Data.Password, 10);
            newAcct.Password = hashedPassword;
            newAcct.LastLoginTime = Date.now();
            await newAcct.save((err,result)=>{
                if (err) DebugUtility.ErrorLog(err);
            });
            dataManager.AddNewAccount(newAcct);

            //Create new client device
            var newClientDevice = new databaseManager.ClientDeviceModel();
            newClientDevice.UID = dataManager.GetClientDeviceUID();
            newClientDevice.OwnerUID = newAcct.UID;
            newClientDevice.DeviceType = Data.device;
            newClientDevice.OS = Data.os_Name_Version;
            newClientDevice.IP = Data.ip;
            await newClientDevice.save((err,result)=>{
                if (err) DebugUtility.ErrorLog(err);
            });
            dataManager.AddNewClientDevice(newClientDevice);
            
            result.msg = newAcct;
            return result;
        }
        else if (Action == "udpate"){
            var targetAcct = dataManager.accountMap[TargetUID];

            if(targetAcct == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.TargetAccountNotExists;
                result.msg = "Target account not found";
                DebugUtility.ErrorLog(result.msg)
                return result;
            }

            if(targetAcct.Authority > CmsUser.Authority){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
                result.msg = "You can't create account with higher authority than your own";
                DebugUtility.ErrorLog(result.msg)
                return result;
            }

            if(Data == null){
                return result;
            }

            var isChange = false;
            
            if(Data.hasOwnProperty('Authority') && Data.Authority != null){
                targetAcct.Authority = Data.Authority;
                isChange = true;
            }
            if(Data.hasOwnProperty('Email') && Data.Email != null){
                targetAcct.Email = Data.Email;
                isChange = true;
            }
            if(Data.hasOwnProperty('Password') && Data.Password != null){
                //Hash Password
                console.log(Data.Password);
                if(Data.Password!==targetAcct.Password){
                    const hashedPassword = await bcrypt.hash(Data.Password, 10);
                    targetAcct.Password = hashedPassword;
                    isChange = true;
                }
            }
                        
            if(isChange){
                await targetAcct.save((err,result)=>{
                    if(err) DebugUtility.ErrorLog(err);
                })
                dataManager.UpdateAccount(targetAcct);
            }
           
           return result; 
        }
        else if (Action == "delete"){
            for (let i = 0; i < TargetUID.length; i++){
                const targetAcct = dataManager.accountMap[TargetUID[i]]

                if(targetAcct == null){
                    result.responseStatus = 400;
                    result.errorCode = CommonUtility.ErrorCode.TargetAccountNotExists;
                    if (result.msg != {}) result.msg = result.msg + `Acct[${TargetUID[i]}]not found; `
                    else result.msg = `Acct[${TargetUID[i]}]not found; `
                }

                else if(targetAcct.Authority > CmsUser.Authority){
                    result.responseStatus = 200;
                    result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
                    result.msg = "You can't create account with higher authority than your own";
                    if (result.msg != {}) result.msg = result.msg + `Acct[${TargetUID[i]}]higher authority than you; `
                    else result.msg = `Acct[${TargetUID[i]}]higher authority than you; `
                }
                else{
                    targetAcct.delete((err,result)=>{
                        if(err) return DebugUtility.ErrorLog(err);
                    });
                    dataManager.DeleteAccount(targetAcct);

                    //delete blacklist(only by AcctUID)
                    const targetBlacklist = dataManager.blacklistByAcctUID[targetAcct.UID];
                    if(targetBlacklist != null){
                        targetBlacklist.delete((err,result)=>{
                            if(err) return DebugUtility.ErrorLog(err);
                        });
                        delete dataManager.blacklistByAcctUID[targetAcct.UID];
                    }
                }
            }
            return result;
            // var targetAcct = dataManager.accountMap[TargetUID];

            // if(targetAcct == null){
            //     result.responseStatus = 400;
            //     result.errorCode = CommonUtility.ErrorCode.TargetAccountNotExists;
            //     result.msg = "Target account not found";
            //     return result;
            // }

            // if(targetAcct.Authority > CmsUser.Authority){
            //     result.responseStatus = 400;
            //     result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
            //     result.msg = "You can't create account with higher authority than your own";
            //     return result;
            // }

            // targetAcct.delete((err,result)=>{
            //     if(err) return DebugUtility.ErrorLog(err);
            // });
            // dataManager.DeleteAccount(targetAcct);
            // return result;
        }
        else{
            result.responseStatus = 400;
            result.errorCode = CommonUtility.ErrorCode.ActionUnknown;
            result.msg = "Action unknown";
            return result;
        }
        
    }
    else if (TargetDB == "post") {
        if(Action == "read"){
            var posts = {};
            var filterObjList = {};
            if(Filter != null){
                filterObjList = FilterUtility.ConstructFilterObj(Filter);
            }

            FilterUtility.Filter(filterObjList, dataManager.postMap, 
                (key, value)=>{
                    posts[value.UID] = value;
                },
                (key, value)=>{
                    var acct = dataManager.accountMap[value.OwnerUID];
                    if(!acct) return false;
                    if(acct.Authority > CmsUser.Authority) return false;
                    return true;
                }            
            );

            result.msg = posts;
            return result;
        }
        else if (Action == "add"){
            //DebugUtility.DebugLog(`CMS Add Post: ${JSON.stringify(Data)}`);
            var newPost = new databaseManager.PostModel();
            newPost.UID = dataManager.GetPostUID();
            newPost.OwnerUID = Data.OwnerUID
            newPost.Title = Data.Title;
            newPost.Holiday = Data.Holiday;
            newPost.Address = Data.Address;
            newPost.Location = Data.Location;
            newPost.Salary = Data.Salary;
            newPost.UnitSize = Data.UnitSize;
            newPost.OtherMaid = Data.OtherMaid;
            newPost.Overseas = Data.Overseas;
            newPost.ShareBed = Data.ShareBed;
            newPost.Accommodation = Data.Accommodation;
            newPost.Language = Data.Language;
            newPost.FirstDay = Data.FirstDay;
            newPost.Deadline = Data.Deadline;
            newPost.Description = Data.Description;
            newPost.Status = Data.Status;
            newPost.Gender = Data.Gender;
            newPost.Experience = Data.Experience;

            //enum for skills
            var skillsObj = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
            if (Data.Skills.find(function(item){return item === "ChineseFood"})) skillsObj[0] =true;
            if (Data.Skills.find(function(item){return item === "WesternFood"})) skillsObj[1] =true;
            if (Data.Skills.find(function(item){return item === "CareNewBorn"})) skillsObj[2] =true;
            if (Data.Skills.find(function(item){return item === "CareToddlers"})) skillsObj[3] =true;
            if (Data.Skills.find(function(item){return item === "CareKids"})) skillsObj[4] =true;
            if (Data.Skills.find(function(item){return item === "CareElderly"})) skillsObj[5] =true;
            if (Data.Skills.find(function(item){return item === "CareDisable"})) skillsObj[6] =true;
            if (Data.Skills.find(function(item){return item === "PetCare"})) skillsObj[7] =true;
            if (Data.Skills.find(function(item){return item === "Gardening"})) skillsObj[8] =true;
            if (Data.Skills.find(function(item){return item === "Marketing"})) skillsObj[9] =true;
            if (Data.Skills.find(function(item){return item === "CarWashing"})) skillsObj[10] =true;
            if (Data.Skills.find(function(item){return item === "Housekeeping"})) skillsObj[11] =true;
            if (Data.Skills.find(function(item){return item === "TutoringChildren"})) skillsObj[12] =true;
            if (Data.Skills.find(function(item){return item === "Driving"})) skillsObj[13] =true;
            if (Data.Skills.find(function(item){return item === "Cooking"})) skillsObj[14] =true;

            //enum for contract status
            var contractObj = [false, false, false, false, false, false];
            if (Data.ContractStatus.find(function(item){return item === "FirstTimeOversea"})) contractObj[0] =true;
            if (Data.ContractStatus.find(function(item){return item === "ExHK"})) contractObj[1] =true;
            if (Data.ContractStatus.find(function(item){return item === "Ex-Oversea"})) contractObj[2] =true;
            if (Data.ContractStatus.find(function(item){return item === "FinishContract"})) contractObj[3] =true;
            if (Data.ContractStatus.find(function(item){return item === "FinishedContractWithSpecialReason"})) contractObj[4] =true;
            if (Data.ContractStatus.find(function(item){return item === "TerminatedOrBreakContract"})) contractObj[5] =true;

            newPost.Skills = skillsObj;
            newPost.ContractStatus = contractObj;


            //set expire time
            var expireDate = new Date();
            newPost.ExpiredTime = expireDate.setUTCMonth(3);
            
            await newPost.save((err,result)=>{
                if(err) DebugUtility.ErrorLog(err);
            });
            
            dataManager.AddNewPost(newPost);
            return result;
        }
        else if (Action == "udpate"){
            var targetPost = dataManager.postMap[TargetUID];
            if(targetPost == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.TargetPostNotExists;
                result.msg = "Target account not found";
                DebugUtility.ErrorLog(`Error Code: ${result.errorCode}`);
                return result;
            }

            if(Data == null){      
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.DataMissing;
                result.msg = "Data missing";         
                DebugUtility.ErrorLog(`Error Code: ${result.errorCode}`);
                return result;
            }

            var isChange = false;
            if(Data.hasOwnProperty('Title') && Data.Title != null){
                targetPost.Title = Data.Title;
                isChange = true;
            }
            if(Data.hasOwnProperty('ContractStatus') && Data.ContractStatus != null){
                //enum for contract status
                var contractObj = [false, false, false, false, false, false];
                if (Data.ContractStatus.find(function(item){return item === "FirstTimeOversea"})) contractObj[0] =true;
                if (Data.ContractStatus.find(function(item){return item === "ExHK"})) contractObj[1] =true;
                if (Data.ContractStatus.find(function(item){return item === "Ex-Oversea"})) contractObj[2] =true;
                if (Data.ContractStatus.find(function(item){return item === "FinishContract"})) contractObj[3] =true;
                if (Data.ContractStatus.find(function(item){return item === "FinishedContractWithSpecialReason"})) contractObj[4] =true;
                if (Data.ContractStatus.find(function(item){return item === "TerminatedOrBreakContract"})) contractObj[5] =true;
                
                targetPost.ContractStatus = contractObj;
                isChange = true;
            }
            if(Data.hasOwnProperty('Skills') && Data.Skills != null){
                //enum for skills
                var skillsObj = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
                if (Data.Skills.find(function(item){return item === "ChineseFood"})) skillsObj[0] =true;
                if (Data.Skills.find(function(item){return item === "WesternFood"})) skillsObj[1] =true;
                if (Data.Skills.find(function(item){return item === "CareNewBorn"})) skillsObj[2] =true;
                if (Data.Skills.find(function(item){return item === "CareToddlers"})) skillsObj[3] =true;
                if (Data.Skills.find(function(item){return item === "CareKids"})) skillsObj[4] =true;
                if (Data.Skills.find(function(item){return item === "CareElderly"})) skillsObj[5] =true;
                if (Data.Skills.find(function(item){return item === "CareDisable"})) skillsObj[6] =true;
                if (Data.Skills.find(function(item){return item === "PetCare"})) skillsObj[7] =true;
                if (Data.Skills.find(function(item){return item === "Gardening"})) skillsObj[8] =true;
                if (Data.Skills.find(function(item){return item === "Marketing"})) skillsObj[9] =true;
                if (Data.Skills.find(function(item){return item === "CarWashing"})) skillsObj[10] =true;
                if (Data.Skills.find(function(item){return item === "Housekeeping"})) skillsObj[11] =true;
                if (Data.Skills.find(function(item){return item === "TutoringChildren"})) skillsObj[12] =true;
                if (Data.Skills.find(function(item){return item === "Driving"})) skillsObj[13] =true;
                if (Data.Skills.find(function(item){return item === "Cooking"})) skillsObj[14] =true;

                targetPost.Skills = skillsObj;
                isChange = true;
            }
            if(Data.hasOwnProperty('Holiday') && Data.Holiday != null){
                targetPost.Holiday = Data.Holiday;
                isChange = true;
            }
            if(Data.hasOwnProperty('Address') && Data.Address != null){
                targetPost.Address = Data.Address;
                isChange = true;
            }
            if(Data.hasOwnProperty('Location') && Data.Location != null){
                targetPost.Location = Data.Location;
                isChange = true;
            }
            if(Data.hasOwnProperty('Salary') && Data.Salary != null){
                targetPost.Salary = Data.Salary;
                isChange = true;
            }
            if(Data.hasOwnProperty('UnitSize') && Data.UnitSize != null){
                targetPost.UnitSize = Data.UnitSize;
                isChange = true;
            }
            if(Data.hasOwnProperty('OtherMaid') && Data.OtherMaid != null){
                targetPost.OtherMaid = Data.OtherMaid;
                isChange = true;
            }
            if(Data.hasOwnProperty('Overseas') && Data.Overseas != null){
                targetPost.Overseas = Data.Overseas;
                isChange = true;
            }
            if(Data.hasOwnProperty('ShareBed') && Data.ShareBed != null){
                targetPost.ShareBed = Data.ShareBed;
                isChange = true;
            }
            if(Data.hasOwnProperty('Accommodation') && Data.Accommodation != null){
                targetPost.Accommodation = Data.Accommodation;
                isChange = true;
            }
            if(Data.hasOwnProperty('Language') && Data.Language != null){
                targetPost.Language = Data.Language;
                isChange = true;
            }
            if(Data.hasOwnProperty('FirstDay') && Data.FirstDay != null){
                targetPost.FirstDay = Data.FirstDay;
                isChange = true;
            }
            if(Data.hasOwnProperty('Deadline') && Data.Deadline != null){
                targetPost.Deadline = Data.Deadline;
                isChange = true;
            }
            if(Data.hasOwnProperty('ExpiredTime') && Data.ExpiredTime != null){
                targetPost.ExpiredTime = Data.ExpiredTime;
                isChange = true;
            }
            if(Data.hasOwnProperty('Description') && Data.Description != null){
                targetPost.Description = Data.Description;
                isChange = true;
            }
            if(Data.hasOwnProperty('Status') && Data.Status != null){
                targetPost.Status = Data.Status;
                isChange = true;
            }
            if(Data.hasOwnProperty('Experience') && Data.Experience != null){
                targetPost.Experience = Data.Experience;
                isChange = true;
            }
            if(Data.hasOwnProperty('Gender') && Data.Gender != null){
                targetPost.Gender = Data.Gender;
                isChange = true;
            }

            if(isChange){
                await targetPost.save((err,result)=>{
                    if(err) DebugUtility.ErrorLog(err);
                });
                dataManager.UpdatePost(targetPost);
            }

            return result;
        }
        else if (Action == "delete"){
            for (let i = 0; i < TargetUID.length; i++){
                const targetPost = dataManager.postMap[TargetUID[i]];
                var owner = dataManager.accountMap[targetPost.OwnerUID];

                if(targetPost == null){
                    result.responseStatus = 400;
                    result.errorCode = CommonUtility.ErrorCode.TargetPostNotExists;
                    if (result.msg!={}) result.msg = result.msg + `Post [${TargetUID[i]}] not found; `
                    else result.msg = `Post [${TargetUID[i]}] not found; `;
                }

                else if(owner!=null && owner.Authority > CmsUser.Authority){
                    result.responseStatus = 400;
                    result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
                    if (result.msg != {}) result.msg = result.msg + `[${TargetUID[i]}higher authority than you; ]`
                    else result.msg = `[${TargetUID[i]}higher authority than you; ]`
                }

                else {
                    targetPost.delete((err,result)=>{
                        if(err) return console.error(err);
                    });
                    dataManager.DeletePost(targetPost);
                }
            }
            
            return result;
        }
        else{
            result.responseStatus = 400;
            result.errorCode = CommonUtility.ErrorCode.ActionUnknown;
            result.msg = "Action unknown";
            return result;
        }
    }
    else if (TargetDB == "profile") { 
        if(Action == "read"){
            var profiles = {};
            var filterObjList = {};
            if(Filter != null){
                filterObjList = FilterUtility.ConstructFilterObj(Filter);
            }            

            FilterUtility.Filter(filterObjList, dataManager.profileMap, 
                (key, value)=>{
                    profiles[value.UID] = value;
                },
                (key, value)=>{
                    var acct = dataManager.accountMap[value.OwnerUID];
                    if(!acct) return false;
                    if(acct.Authority > CmsUser.Authority) return false;
                    return true;
                }            
            );

            result.msg = profiles;
            return result;
        }
        else if(Action == "add"){
            if(Data == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.DataMissing;
                result.msg = "Data missing";
                console.log(1);
                return result;
            }

            // if(dataManager.profileMap[Data.UID] != null){
            //     result.responseStatus = 400;
            //     result.errorCode = CommonUtility.ErrorCode.ProfileReadyExists;
            //     result.msg = "Try Using Update instead";
            //     console.log(2);
            //     return result;
            // }

            var IntOwnerUID = parseInt(TargetUID, 10); 
            var newProfile = new databaseManager.ProfileModel();
            newProfile.UID = dataManager.GetProfileUID();
            newProfile.FirstName = Data.FirstName;
            newProfile.LastName = Data.LastName;
            newProfile.PhoneNumber = Data.PhoneNumber;
            newProfile.Birth = Data.Birth;
            newProfile.OwnerUID = IntOwnerUID;
            newProfile.Email = Data.Email;
            // newProfile.Priority = Data.Priority;
            // newProfile.Info = Data.Info;
            // newProfile.Salary = Data.Salary;
            // newProfile.NonDomesticExp = Data.NonDomesticExp;
            // newProfile.DomesticExp = Data.DomesticExp;
            // newProfile.Skills = Data.Skills;
            // newProfile.Gender = Data.Gender;
            // newProfile.Location = Data.Location;
            // newProfile.ContractStatus = Data.ContractNum;
            // newProfile.AvailableDate = Data.AvailableDate;
            // newProfile.Nationality = Data.Nationality;
            // newProfile.Education = Data.Education;
            // newProfile.Religion = Data.Religion;
            // newProfile.Marriage = Data.Marriage;
            // newProfile.Spouse = Data.Spouse;
            // newProfile.NumOfChild = Data.NumOfChild;
            // newProfile.Weight = Data.Weight;
            // newProfile.Height = Data.Height;
            // newProfile.Language = Data.Language;
            // newProfile.Intro = Data.Intro;
            newProfile.Authority = Data.Authority;
            newProfile.Status = Data.Status;
            newProfile.Address = Data.Address;
            newProfile.Declaration = Data.Declaration;


            if(Files !== null){
                if(Files.Avatar != null){
                    // isChange = true
                    //path.normalize(CommonUtility.DirectoryPath.upload + targetUser.UID + "/" + files.filetoupload.originalFilename);
                    var newPath = "./client/public/uploads/"+newProfile.OwnerUID+"_"+Files.Avatar.name;
                    //var base64Data = Data.AvatarData.replace(/^data:image\/png;base64,/, "")
                    console.log(newPath);
                    fs.writeFile(newPath, Files.Avatar.data , err=>{})
                    //fs.createWriteStream(newPath).write(Data.AvatarData);
                    newProfile.AvatarIconPath = newPath.slice(1);
                    console.log(newPath.slice(1));
                }
            }

            await newProfile.save((err,result)=>{
                if(err) DebugUtility.ErrorLog(err);
            });
            dataManager.AddNewProfile(newProfile);
            result.msg = newProfile;
            return result;
        }
        else if (Action == "udpate"){
            var targetProfile = dataManager.profileMap[TargetUID];

            if(targetProfile == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.ProfileNotExists;
                result.msg = "Target Profile not found";
                return result; 
            }

            if(Data == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.DataMissing;
                result.msg = "Data missing";
                return result;
            }

            var isChange = false;

            if(Data.hasOwnProperty('FirstName') && Data.FirstName != null){
                targetProfile.FirstName = Data.FirstName;
                isChange = true;
            }
            if(Data.hasOwnProperty('LastName') && Data.LastName != null){
                targetProfile.LastName = Data.LastName;
                isChange = true;
            }
            if(Data.hasOwnProperty('PhoneNumber') && Data.PhoneNumber != null){
                targetProfile.PhoneNumber = Data.PhoneNumber;
                isChange = true;
            }
            if(Data.hasOwnProperty('Bio') && Data.Bio != null){
                targetProfile.BIO = Data.Bio;
                isChange = true;
            }
            if(Data.hasOwnProperty('Address') && Data.Address != null){
                targetProfile.Address = Data.Address;
                isChange = true;
            }
            if(Data.hasOwnProperty('Location') && Data.Location != null){
                targetProfile.Location = Data.Location;
                isChange = true;
            }
            if(Data.hasOwnProperty('Gender') && Data.Gender != null){
                targetProfile.Gender = Data.Gender;
                isChange = true;
            }
            if(Data.hasOwnProperty('Localization') && Data.Localization != null){
                targetProfile.Localization = Data.Localization;
                isChange = true;
            }
            if(Data.hasOwnProperty('ContractStatus') && Data.ContractStatus != null){
                targetProfile.ContractStatus = Data.ContractStatus;
                isChange = true;
            }
            if(Data.hasOwnProperty('Birth') && Data.Birth != null){
                targetProfile.Birth = parseInt(Data.Birth, 10);
                isChange = true;
            }
            if(Data.hasOwnProperty('AvailableDate') && Data.AvailableDate != null){
                targetProfile.AvailableDate = parseInt(Data.AvailableDate, 10);
                isChange = true;
            }
            if(Data.hasOwnProperty('Nationality') && Data.Nationality != null){
                targetProfile.Nationality = Data.Nationality;
                isChange = true;
            }
            if(Data.hasOwnProperty('Education') && Data.Education != null){
                targetProfile.Education = Data.Education;
                isChange = true;
            }
            if(Data.hasOwnProperty('Religion') && Data.Religion != null){
                targetProfile.Religion = Data.Religion;
                isChange = true;
            }
            if(Data.hasOwnProperty('Marriage') && Data.Marriage != null){
                targetProfile.Marriage = Data.Marriage;
                isChange = true;
            }
            if(Data.hasOwnProperty('Spouse') && Data.Spouse != null){
                targetProfile.Spouse = Data.Spouse;
                isChange = true;
            }
            if(Data.hasOwnProperty('NumOfChild') && Data.NumOfChild != null){
                targetProfile.NumOfChild = Data.NumOfChild;
                isChange = true;
            }
            if(Data.hasOwnProperty('Weight') && Data.Weight != null){
                targetProfile.Weight = Data.Weight;
                isChange = true;
            }
            if(Data.hasOwnProperty('Height') && Data.Height != null){
                targetProfile.Height = Data.Height;
                isChange = true;
            }
            if(Data.hasOwnProperty('Doc') && Data.Doc != null){
                targetProfile.Doc = Data.Doc;
                isChange = true;
            }
            if(Data.hasOwnProperty('Language') && Data.Language != null){
                targetProfile.Language = Data.Language;
                isChange = true;
            }
            if(Data.hasOwnProperty('Intro') && Data.Intro != null){
                targetProfile.Intro = Data.Intro;
                isChange = true;
            }
            
            if(Data.hasOwnProperty('Skills') && Data.Skills != null){
                //enum for skills
                var skillsObj = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
                if (Data.Skills.find(function(item){return item === "ChineseFood"})) skillsObj[0] =true;
                if (Data.Skills.find(function(item){return item === "WesternFood"})) skillsObj[1] =true;
                if (Data.Skills.find(function(item){return item === "CareNewBorn"})) skillsObj[2] =true;
                if (Data.Skills.find(function(item){return item === "CareToddlers"})) skillsObj[3] =true;
                if (Data.Skills.find(function(item){return item === "CareKids"})) skillsObj[4] =true;
                if (Data.Skills.find(function(item){return item === "CareElderly"})) skillsObj[5] =true;
                if (Data.Skills.find(function(item){return item === "CareDisable"})) skillsObj[6] =true;
                if (Data.Skills.find(function(item){return item === "PetCare"})) skillsObj[7] =true;
                if (Data.Skills.find(function(item){return item === "Gardening"})) skillsObj[8] =true;
                if (Data.Skills.find(function(item){return item === "Marketing"})) skillsObj[9] =true;
                if (Data.Skills.find(function(item){return item === "CarWashing"})) skillsObj[10] =true;
                if (Data.Skills.find(function(item){return item === "Housekeeping"})) skillsObj[11] =true;
                if (Data.Skills.find(function(item){return item === "TutoringChildren"})) skillsObj[12] =true;
                if (Data.Skills.find(function(item){return item === "Driving"})) skillsObj[13] =true;
                if (Data.Skills.find(function(item){return item === "Cooking"})) skillsObj[14] =true;
                targetProfile.Skills = skillsObj;
                isChange = true;
            }
            
            if(Data.hasOwnProperty('NonDomesticExp') && Data.NonDomesticExp != null){
                targetProfile.NonDomesticExp = Data.NonDomesticExp;
                isChange = true;
            }
            if(Data.hasOwnProperty('DomesticExp') && Data.DomesticExp != null){
                targetProfile.DomesticExp = Data.DomesticExp;
                isChange = true;
            }
            if(Data.hasOwnProperty('Priority') && Data.Priority != null){
                targetProfile.Priority = Data.Priority;
                isChange = true;
            }
            if(Data.hasOwnProperty('Salary') && Data.Salary != null){
                targetProfile.Salary = Data.Salary;
                isChange = true;
            }
            if(Data.hasOwnProperty('Info') && Data.Info != null){
                targetProfile.Info = Data.Info;
                isChange = true;
            }
            if(Data.hasOwnProperty('Authority') && Data.Authority != null){
                targetProfile.Authority = Data.Authority;
                isChange = true;
            }
            if(Data.hasOwnProperty('Email') && Data.Email != null){
                targetProfile.Email = Data.Email;
                isChange = true;
            }
            if(Data.hasOwnProperty('Status') && Data.Status != null){
                targetProfile.Status = parseInt(Data.Status,10);
                console.log(targetProfile.Status);
                isChange = true;
            }
            if(Data.hasOwnProperty('Declaration') && Data.Declaration != null){
                targetProfile.Declaration = Data.Declaration;
                console.log(targetProfile.Declaration);
                isChange = true;
            }

            if(Files !== null){
                if(Files.Avatar != null){
                    // isChange = true
                    //path.normalize(CommonUtility.DirectoryPath.upload + targetUser.UID + "/" + files.filetoupload.originalFilename);
                    var newPath = "./client/public/uploads/"+targetProfile.OwnerUID+"_"+Files.Avatar.name;
                    //var base64Data = Data.AvatarData.replace(/^data:image\/png;base64,/, "")
                    console.log(newPath);
                    fs.writeFile(newPath, Files.Avatar.data , err=>{})
                    //fs.createWriteStream(newPath).write(Data.AvatarData);
                    targetProfile.AvatarIconPath = newPath.slice(1);
                    console.log(newPath.slice(1));
                }
            }

            targetProfile.UpdateTime = Date.now();
            targetProfile.markModified("AvatarIconPath");
            try{
                await targetProfile.save((err,result)=>{
                    if(err)DebugUtility.ErrorLog(err);
                    dataManager.UpdateProfile(targetProfile);
                });
            }catch(err){
                if(err) DebugUtility.ErrorLog("on99999"+err);
            }
            
            
            return result;
        }
        else if (Action == "delete"){
            for (let i = 0; i < TargetUID.length; i++){
                const targetProfile = dataManager.profileMap[TargetUID[i]];

                if(targetProfile == null){
                    result.responseStatus = 400;
                    result.errorCode = CommonUtility.ErrorCode.ProfileNotExists;
                    if(result.msg != {}) result.msg = result.msg + `Profile[${TargetUID[i]}]not found; `
                    else result.msg = `Profile[${TargetUID[i]}]not found; `
                    return result;
                }
                else if(dataManager.accountMap[targetProfile.OwnerUID] > CmsUser.Authority){
                    result.responseStatus = 200;
                    result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
                    result.msg = "You can't create account with higher authority than your own";
                    if (result.msg != {}) result.msg = result.msg + `[${TargetUID[i]}higher authority than you; ]`
                    else result.msg = `[${TargetUID[i]}higher authority than you; ]`
                }
                else {
                    targetProfile.delete((err,result)=>{
                        if(err) return DebugUtility.ErrorLog(err);
                    });
                    dataManager.DeleteProfile(targetProfile);
                }
            }
            return result;
        }
        else{
            result.responseStatus = 400;
            result.errorCode = CommonUtility.ErrorCode.ActionUnknown;
            result.msg = "Action unknown";
            return result;
        }
        
    }
    //#endregion

    //#region Data Set
    else if(TargetDB == "localization"){
        if(Action == "read"){
            result.msg = dataManager.localizationMap;
            return result;
        }
        else if(Action == "add"){
            if(Data == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.DataMissing;
                result.msg = "Data missing";
                return result;
            }

            var newID = -1;
            if(Data.hasOwnProperty('ID') && Data.ID != null){
                newID = Data.ID;
            }
            else{
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.LocalizationInvalidID;
                result.msg = "Invalid ID";
                return result;
            }
            const currentLocalization = dataManager.localizationMap[newID];
            if(currentLocalization != null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.LocalizationReadyExists;
                result.msg = "Localization ready exists";
                return result;
            }
            
            var newLocalization = new databaseManager.LocalizationModel();
            newLocalization.ID = newID;
            if(Data.hasOwnProperty('LangHK') && Data.LangHK != null){
                newLocalization.LangHK = Data.LangHK;
            }
            if(Data.hasOwnProperty('LangTW') && Data.LangTW != null){
                newLocalization.LangTW = Data.LangTW;
            }
            if(Data.hasOwnProperty('LangCN') && Data.LangCN != null){
                newLocalization.LangCN = Data.LangCN;
            }
            if(Data.hasOwnProperty('LangEN') && Data.LangEN != null){
                newLocalization.LangEN = Data.LangEN;
            }
            if(Data.hasOwnProperty('LangKR') && Data.LangKR != null){
                newLocalization.LangKR = Data.LangKR;
            }
            if(Data.hasOwnProperty('LangJP') && Data.LangJP != null){
                newLocalization.LangJP = Data.LangJP;
            }
            if(Data.hasOwnProperty('LangID') && Data.LangID != null){
                newLocalization.LangID = Data.LangID;
            }

            newLocalization.save((err,result)=>{
                if(err) DebugUtility.ErrorLog(err);
            });
            dataManager.AddNewPost(newLocalization);
            return result;
        }
        else if (Action == "udpate"){
            var targetLocalization = dataManager.localizationMap[TargetUID];
            if(targetLocalization == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.LocalizationNotExists;
                result.msg = "Target localization not found";
                return result;
            }

            if(Data == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.DataMissing;
                result.msg = "Data missing";
                return result;
            }

            var isChange = false;
            if(Data.hasOwnProperty('LangHK') && Data.LangHK != null){
                targetLocalization.LangHK = Data.LangHK;
                isChange = true;
            }
            if(Data.hasOwnProperty('LangTW') && Data.LangTW != null){
                targetLocalization.LangTW = Data.LangTW;
                isChange = true;
            }
            if(Data.hasOwnProperty('LangCN') && Data.LangCN != null){
                targetLocalization.LangCN = Data.LangCN;
                isChange = true;
            }
            if(Data.hasOwnProperty('LangEN') && Data.LangEN != null){
                targetLocalization.LangEN = Data.LangEN;
                isChange = true;
            }
            if(Data.hasOwnProperty('LangKR') && Data.LangKR != null){
                targetLocalization.LangKR = Data.LangKR;
                isChange = true;
            }
            if(Data.hasOwnProperty('LangJP') && Data.LangJP != null){
                targetLocalization.LangJP = Data.LangJP;
                isChange = true;
            }
            if(Data.hasOwnProperty('LangID') && Data.LangID != null){
                targetLocalization.LangID = Data.LangID;
                isChange = true;
            }

            if(isChange){
                targetLocalization.UpdateTime = Date.now;
                targetLocalization.save((err,result)=>{
                    if(err) DebugUtility.ErrorLog(err);
                });
                dataManager.UpdatePost(targetLocalization);
            }

            return result;
        }
        else if (Action == "delete"){
            var targetLocalization = dataManager.localizationMap[TargetUID];
            if(targetLocalization == null){
                result.responseStatus = 400;
                result.errorCode = CommonUtility.ErrorCode.LocalizationNotExists;
                result.msg = "Target localization not found";
                return result;
            }

            targetLocalization.delete((err,result)=>{
                if(err) DebugUtility.ErrorLog(err);
            });
            dataManager.DeletePost(targetLocalization);
        }
        else{
            result.responseStatus = 400;
            result.errorCode = CommonUtility.ErrorCode.ActionUnknown;
            result.msg = "Action unknown";
            return result;
        }
    }
    //#endregion
}

async function UploadFile(ProfUID, contents, body){
    var result = { responseStatus: 200, errorCode: 0,  msg: []};
    //Retrieve Data
    const targetProfile = dataManager.profileMap[ProfUID]
    const targetUser = dataManager.accountMap[targetProfile.OwnerUID];

    //check features is on or not
    /*
    if(!dataManager.serverFeatureData[CommonUtility.FeatureID.UploadFile].isActive){
        result.msg = 'Oops 404. That\'s an error.\n The request was not found on this server, please content developers for further information.'
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_FeatureNotOn;
        result.responseStatus = 400;
        return result;
    }
    */
    if(!targetProfile){
        result.msg = "Invaild Profile!"
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        console.log("Profile missing, "+ ProfUID);
        return result;
    }

    // if(dataManager.blacklistByAcctUID[AcctUID]){
    //     DebugUtility.ErrorLog(`${AcctUID} is on the blacklistByIP`);
    //     result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
    //     result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
    //     result.responseStatus = 400;  
    //     console.log("2");
    //     return result; 
    // }

    // //check is target on the blacklistByIP
    // const clientDevice = dataManager.clientDeviceMapByOwner[AcctUID];

    // if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
    //     DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
    //     result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
    //     result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
    //     result.responseStatus = 400;
    //     console.log("3");
    //     return result;
    // }

    
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
    
    // const targetProfile = dataManager.profileMapByOwner[AcctUID];
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
    
    if(targetProfile.Pics == []){ targetProfile.Pics = ['','','','']; }
    if(targetProfile.Doc == []){ targetProfile.Doc = ['','','','','','','','','','']; }
    
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
        targetProfile.Doc[0] == '';
        targetProfile.Doc[1] == '';
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
        targetProfile.Doc[2] == '';
        targetProfile.Doc[3] == '';
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
        targetProfile.Doc[4] == '';
        targetProfile.Doc[5] == '';
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
        targetProfile.Doc[6] == '';
        targetProfile.Doc[7] == '';
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
        targetProfile.Doc[8] == '';
        targetProfile.Doc[9] == '';
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

    targetProfile.markModified('Pics')
    targetProfile.markModified('Doc');
    await targetProfile.save((err,result)=>{
        if(err) DebugUtility.ErrorLog(err);
        //DebugUtility.WarningLog(`After Save: ${targetProfile}`);
        dataManager.UpdateProfile(targetProfile);
    });

    return result;
}

async function RetreiveServerStatus(CmsUser){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    if(!CmsUser){
        DebugUtility.ErrorLog("CmsUser is null");
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        return result;
    }

    if(CmsUser.Authority < CommonUtility.UserTier.cmsStdUser){
        DebugUtility.ErrorLog("CmsUser is not authorized");
        result.responseStatus = 400;
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
        return result;
    }

    if(dataManager.blacklistByAcctUID[CmsUser.UID]){
        DebugUtility.ErrorLog(`${CmsUser.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[CmsUser.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }

    result.msg = {
        "CPUUsage": CommonUtility.GetCPUUsagePrecentage(),
        "TotalMemory": CommonUtility.GetTotalMem_MB(),
        "UsedMemory": CommonUtility.GetUsedMem_MB(),
        "TotalStorage": 0, //CommonUtility.GetTotalStorage_MB(),
        "UsedStorage": 0, //CommonUtility.GetUsedStorage_MB(),
        "ServerUpTime": CommonUtility.GetServerUpTime_S(),
    }

    return result;
}

async function RetreiveNewUserStatistic(CmsUser){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    if(!CmsUser){
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        result.msg = "Account not found";
        DebugUtility.ErrorLog("Account not found");
        return result;
    }

    if(CmsUser.Authority < CommonUtility.UserTier.cmsStdUser){
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
        result.responseStatus = 400;
        result.msg = "Authority not enough";
        DebugUtility.ErrorLog("Authority not enough");
        return result;
    }

    if(dataManager.blacklistByAcctUID[CmsUser.UID]){
        DebugUtility.ErrorLog(`${CmsUser.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[CmsUser.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }
    
    var monthName = new Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
    var d = new Date();
    d.setDate(1);
    for (i=0; i<=11; i++) {
        var count = 0;
        var lastDayOfMonth = new Date(d);
        lastDayOfMonth.setMonth(d.getMonth()+1, 0);
        for(const[acctUID, acct] of Object.entries(dataManager.accountMap)){   
            if(d.getTime() <= acct.CreateTime && lastDayOfMonth.getTime() >= acct.CreateTime){
                //DebugUtility.DebugLog(`${acctUID}: valid => ${monthName[d.getMonth()]}`);
                count++;
            }
        }
        result.msg[monthName[d.getMonth()]] = count;
        //DebugUtility.DebugLog(`${monthName[d.getMonth()]}: ${count}`);
        d.setMonth(d.getMonth() - 1);
    }

    return result;
}

async function GetAllPostCount(CmsUser){
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    if(!CmsUser){
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_AccountNotFound;
        result.responseStatus = 400;
        result.msg = "Account not found";
        DebugUtility.ErrorLog("Account not found");
        return result;
    }

    if(CmsUser.Authority < CommonUtility.UserTier.cmsStdUser){
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Authority;
        result.responseStatus = 400;
        result.msg = "Authority not enough";
        DebugUtility.ErrorLog("Authority not enough");
        return result;
    }

    if(dataManager.blacklistByAcctUID[CmsUser.UID]){
        DebugUtility.ErrorLog(`${CmsUser.UID} is on the blacklistByIP`);
        result.msg = 'Your account has been ban deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;  
        return result; 
    }

    //check is target on the blacklistByIP
    const clientDevice = dataManager.clientDeviceMapByOwner[CmsUser.UID];

    if(clientDevice && dataManager.blacklistByIP[clientDevice.ip]){
        DebugUtility.ErrorLog(`${clientDevice.ip} is on the blacklistByIP`);
        result.msg = 'Can\'t Register deal to some reason, Please content to customer service to get more details';
        result.errorCode = CommonUtility.ErrorCode.AccessDenied_Blacklisted;
        result.responseStatus = 400;
        return result;
    }
    
    var count = 0;
    for(const[acctUID, acct] of Object.entries(dataManager.postMap)){
        count++;
    }
    result.msg = {totalPostCount: count};
    return result;
}


module.exports = {
    Blacklist, CRUD, RetreiveServerStatus, UploadFile, RetreiveNewUserStatistic, GetAllPostCount
}

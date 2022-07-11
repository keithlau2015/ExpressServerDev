const {DebugLog, WarningLog} = require('./Utils/DebugUtility');
const {IsNull, AccessControlType, ObjSize} = require('./Utils/CommonUtility');
const { object } = require('joi');

//要cache哂所有Data原因: 用find/findOne一定要用async(非同步)，會影響可讀性同會慢d
class DataManager
{
    constructor(){
        //UID
        this.accountUID = 0;
        this.profileUID = 0;
        this.stackTokenUID = 0;
        this.clientDeviceUID = 0;
        this.postUID = 0;
        this.msgUID= 0 ;
    
        //Pairup 
        //警告: 有可能因為呢個而爆ram, u better understand wt u requesting
        this.applyEachOther = [];
        this.appliedPost = [];
        this.appliedHelper = [];

        //Online user
        this.onlineAccount = {};

        //System Data
        //Account Map
        //Key: UID, Value: account Obj
        this.accountMap = {};
        //Key: Email, Value: account Obj
        this.accountMapByEmail = {};

        //Profile Map
        //Key: UID, Value: profile Obj
        this.profileMap = {};
        //Key: ownerUID, Value: profile Obj
        this.profileMapByOwner = {};
        //Key: PhoneNumber, Value: profile Obj
        this.profileMapByPhoneNumber = {};
        //Key: Profile Status, Value: profile list
        this.profileMapByStatus ={};

        //Post Map
        //Key: UID, Value: post Obj
        this.postMap = {};
        //Key: ownerUID, Value: post list
        this.postMapByOwnerUID = {};
        //Key: Post Status, Value: post list
        this.postMapByStatus = {};

        //Stack Token Map
        //Key: UID, Value: stackToken Obj
        this.stackTokenMap = {};
        //Key: ownerUID, Value: StackToken List
        this.stackTokenMapByOwner = {};

        //Client Device
        //Key: UID, Value: ClientDevice Obj
        this.clientDeviceMap = {};
        //Key: ownerUID, Value: ClientDevice List
        this.clientDeviceMapByOwner = {};    

        //System Reference Data        
        //Localization Map
        //Key: ID, Value: Localization Obj
        this.localizationMap = {};

        //Token Map
        //Key: ID, Value: Token Obj
        this.tokenMap = {};
        //Key: Time Scheduler ID, Value: Token List
        this.tokenMapByTime = {};

        //Choice List Map
        //Key: ID, Value: Choice list Obj
        this.choiceListMap = {};
        this.choiceListGroupMap = {};

        //Condition Map
        //Key: ID, Value: Condition Obj
        this.conditionMap = {};

        //Tag Map
        //Key: ID, Value: Tag Obj
        this.tagMap = {};

        //Msg Map
        //Key: ID, Value: Msg Obj
        this.msgMap = {};
        this.msgMapByOwnerUID = {};

        //Time Scheduler Map
        //Key: Id, Value: Time Scheduler Obj
        this.timeSchedulerMap = {};

        //Pending Verify Account Obj
        //Key: EmailToken, Value: {account, profile, clientDevice}
        this.pendingVerifyUserMap = {};

        //Key: ResetToken, Value: account Obj
        this.pendingVerifyForgetPasswordMap = {};

        //Access control list
        this.blacklistByIP = {};
        this.blacklistByAcctUID = {};
        this.banlist = [];
        this.cmsAcctWhitelist = {};

        this.serverFeatureData = {};

        this.serverProperties = {};
        this.temporaryBlockLogin = {};
        DataManager.instance = this;
    }

    //#region Constructor
    //System Config
    ConstructAccessControllist(obj){
        if(IsNull(obj)){
            WarningLog("Construct Access Control list Parameter is NULL");
            return;
        }

        for(const[key, value] of Object.entries(obj)){
            if(value.Type == AccessControlType.blacklistByIP){
                this.blacklistByIP[value.IP] = value;
            }
            else if(value.Type == AccessControlType.banlist){
                this.banlist.push(value.IP);
            }
            else if(value.Type == AccessControlType.whitelist){
                this.cmsAcctWhitelist[value.IP] = value;
            }
            else if(value.Type == AccessControlType.blacklistByAcctUID){
                this.blacklistByAcctUID[value.AcctUID] = value
            }
        }
    }

    ConstructServerProperties(obj){
        if(IsNull(obj)){
            WarningLog("Construct ServerProperties Parameter is NULL");
            return;
        }

        for(const[key, value] of Object.entries(obj)){
            this.serverProperties[value.ID] = value;          
        }
    }

    ConstructFeature(obj){
        if(IsNull(obj)){
            WarningLog("Construct Feature Parameter is NULL");
            return;
        }

        for(const[key, value] of Object.entries(obj)){
            this.serverFeatureData[value.ID] = value;          
        }
    }

    //map constructor
    //System Reference Data
    ConstructConditionMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Condition Map Parameter is NULL");
            return;
        }
        
        for(const[key, value] of Object.entries(obj)){
            this.conditionMap[value.ID] = value;
        }
    }

    ConstructTagMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Tag Map Parameter is NULL");
            return;
        }
        
        for(const[key, value] of Object.entries(obj)){
            this.tagMap[value.ID] = value;
        }
    }

    ConstructChoiceListMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Choice list Map Parameter is NULL");
            return;
        }
        
        for(const[key, value] of Object.entries(obj)){
            this.choiceListMap[value.ID] = value;
            var choiceList = this.choiceListGroupMap[value.ExpendChoiceListID];
            if(IsNull(choiceList) || choiceList == undefined){
                choiceList = [];
                this.choiceListGroupMap[value.ExpendChoiceListID] = choiceList;
            }
            choiceList.push(value);
        }
    }

    ConstructLocalizationMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Localization Map Parameter is NULL");
            return;
        }
        
        for(const[key, value] of Object.entries(obj)){
            this.localizationMap[value.ID] = value;
        }
    }

    ConstructTokenMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Token Map Parameter is NULL");
            return;

        }
        for(const[key, value] of Object.entries(obj)){
            this.tokenMap[value.ID] = value;
        }
    }

    //System Data
    ConstructAccountMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Account Map Parameter is NULL");
            return;
        }

        var uid = 0;
        for(const[key, value] of Object.entries(obj)){
            this.accountMap[value.UID] = value;
            this.accountMapByEmail[value.Email] = value;
            if(value.UID > uid)
                uid = value.UID;
        }
        this.accountUID = uid;
    }

    ConstructStackTokenMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Stack Token Map Parameter is NULL");
            return;
        }

        var uid = 0;
        for(const[key, value] of Object.entries(obj)){
            this.stackTokenMap[value.UID] = value;
            if(value.UID > uid)
                uid = value.UID;
        }
        this.stackTokenUID = uid;
    }

    ConstructClientDeviceMap(obj)
    {
        if(IsNull(obj)){
            WarningLog("Construct Client Device Map Parameter is NULL");
            return;
        }

        var uid = 0;
        for(const[key, value] of Object.entries(obj)){
            this.clientDeviceMap[value.UID] = value;
            this.clientDeviceMapByOwner[value.OwnerUID] = value;
            if(value.UID > uid)
                uid = value.UID;
        }
        this.clientDeviceUID = uid;
    }

    ConstructProfileMap(obj){
        if(IsNull(obj)){
            WarningLog("Construct Profile Map Parameter is NULL");
            return;
        }

        var uid = 0;
        for(const[key, value] of Object.entries(obj)){
            this.profileMap[value.UID] = value;
            if(IsNull(this.profileMapByOwner[value.OwnerUID])){
                this.profileMapByOwner[value.OwnerUID] = value;
            }
            else{
                WarningLog(`Profile Map By Owner UID ${value.OwnerUID} is already have profile, problematic profile UID[${value.UID}]`);
            }
            
            var statusProfileList = this.profileMapByStatus[value.Status]
            if(IsNull(statusProfileList)|| statusProfileList == undefined){
                statusProfileList = [];
                this.profileMapByStatus[value.Status] = statusProfileList
            }
            statusProfileList.push(value);

            if(value.UID > uid)
                uid = value.UID;

            if(value.AppliedBy != null && value.AppliedBy.length > 0){
                this.appliedHelper.push(value);
            }
        }
        this.appliedHelper.sort((a, b) => (a.AppliedTime > b.AppliedTime) ? 1 : -1);
        this.profileUID = uid;
    }

    ConstructPostMap(obj){
        if(IsNull(obj)){
            WarningLog("Construct Post Map Parameter is NULL");
            return;
        }

        var uid = 0;
        for(const[key, value] of Object.entries(obj)){
            this.postMap[value.UID] = value;

            var ownerPostList = this.postMapByOwnerUID[value.OwnerUID]
            if(IsNull(ownerPostList) || ownerPostList == undefined){
                ownerPostList = [];
                this.postMapByOwnerUID[value.OwnerUID] = ownerPostList;
            }
            ownerPostList.push(value);

            var statusPostList = this.postMapByStatus[value.Status]
            if(IsNull(statusPostList) || statusPostList == undefined){
                statusPostList = [];
                this.postMapByStatus[value.Status] = statusPostList;
            }
            statusPostList.push(value);

            if(value.UID > uid)
                uid = value.UID;

            if(value.AppliedBy != null && value.AppliedBy.length > 0){
                this.appliedPost.push(value);
            }
        }
        this.appliedPost.sort((a, b) => (a.AppliedTime > b.AppliedTime) ? 1 : -1);
        this.postUID = uid;
    }

    ConstrcuctMsgMap(obj){
        if(IsNull(obj)){
            WarningLog("Construct Msg Map Parameter is NULL");
            return;
        }

        var uid = 0;
        for(const[key, value] of Object.entries(obj)){
            this.msgMap[value.UID] = value;
            var msgList = this.msgMapByOwnerUID[value.OwnerUID];
            if(IsNull(msgList) || msgList == undefined){
                msgList = [];
                this.msgMapByOwnerUID[value.OwnerUID] = msgList;
            }
            msgList.push(value);
            if(value.UID > uid)
                uid = value.UID;
        }
        this.msgUID = uid;
    }
    //#endregion
    
    //#region Add
    //====================================================================================
    AddNewAccount(obj){
        if(IsNull(obj)){
            WarningLog("Add New Account Parameter is NULL");
            return;
        }

        this.accountMap[obj.UID] = obj;
        this.accountMapByEmail[obj.Email] = obj;
    }

    AddNewProfile(obj){
        if(IsNull(obj)){
            WarningLog("Add New Profile Parameter is NULL");
            return;
        }

        this.profileMap[obj.UID] = obj;
        var statusProfileList = this.profileMapByStatus[obj.Status];
        if(IsNull(statusProfileList) || statusProfileList == undefined){
            statusProfileList = [];
            this.profileMapByStatus[obj.Status] = statusProfileList;
        }
        statusProfileList.push(obj);
        
        if(IsNull(this.profileMapByOwner[obj.OwnerUID])){
            this.profileMapByOwner[obj.OwnerUID] = obj;
        }
        else{
            WarningLog(`Profile Map By Owner UID ${obj.OwnerUID} is already have profile, problematic profile UID[${obj.UID}]`);
        }
        this.profileMapByPhoneNumber[obj.PhoneNumber] = obj;

    }

    AddNewStackToken(obj){
        if(IsNull(obj)){
            WarningLog("Add New Stack Token Parameter is NULL");
            return;
        }

        this.stackTokenMap[obj.UID] = obj;
        var stackTokenList = this.stackTokenMapByOwner[obj.OwnerUID];
        if(IsNull(stackTokenList) || stackTokenList == undefined){
            stackTokenList= [];
            this.stackTokenMapByOwner[obj.OwnerUID] = stackTokenList;
        }
        stackTokenList.push(obj);
    }

    AddNewClientDevice(obj){
        if(IsNull(obj)){
            WarningLog("Add New Client Device Parameter is NULL");
            return;
        }

        this.clientDeviceMap[obj.UID] = obj;
        this.clientDeviceMapByOwner[obj.OwnerUID] = obj;
    }

    AddNewPost(obj){
        if(IsNull(obj)){
            WarningLog("Add New Post Parameter is NULL");
            return;
        }
        
        this.postMap[obj.UID] = obj;
        var ownerPostList = this.postMapByOwnerUID[obj.OwnerUID];
        if(IsNull(ownerPostList) || ownerPostList == undefined){
            ownerPostList = [];
            this.postMapByOwnerUID[obj.OwnerUID] = ownerPostList;
        }
        ownerPostList.push(obj);

        var statusPostList = this.postMapByStatus[obj.Status]
        if(IsNull(statusPostList) || statusPostList == undefined){
            statusPostList = [];
            this.postMapByStatus[obj.Status] = statusPostList;
        }
        statusPostList.push(obj);

        var postList = this.postMap[obj]
        if(IsNull(postList) || postList == undefined){
            postList = [];
            this.postMap[obj] = postList;
        }
        postList.push(obj);
    }

    AddNewMsg(obj){
        if(IsNull(obj)){
            WarningLog("Add New Client Device Parameter is NULL");
            return;
        }

        this.msgMap[obj.UID] = obj;
        var msgList = this.msgMapByOwnerUID[obj.OwnerUID];
        if(IsNull(msgList) || msgList == undefined){
            msgList = [];
            this.msgMapByOwnerUID[obj.OwnerUID] = msgList;
        }
        msgList.push(obj);
    }

    AddNewLocalization(obj){
        if(IsNull(obj)){
            WarningLog("Add New Localization Parameter is NULL");
            return;
        }

        this.localizationMap[obj.ID] = obj;
    } 
    //#endregion
    
    //#region Update
    //====================================================================================
    UpdateAccount(obj){
        if(IsNull(obj)){
            WarningLog("Update Account Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Update Account Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.Email)){
            WarningLog("Update Account Parameter Email Field is NULL");
            return;
        }

        this.accountMap[obj.UID] = obj;
        this.accountMapByEmail[obj.Email] = obj;
    }

    UpdateProfile(obj){
        if(IsNull(obj)){
            WarningLog("Update Profile Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Update Profile Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Update Profile Parameter OwnerUID Field is NULL");
            return;
        }

        this.profileMap[obj.UID] = obj;
        this.profileMapByOwner[obj.OwnerUID] = obj;
        this.profileMapByPhoneNumber[obj.PhoneNumber] = obj;
        this.ReconstructProfileByStatusMap()
    }
    
    UpdateClientDevice(obj){
        if(IsNull(obj)){
            WarningLog("Update Client Device Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Update Client Device Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Update Client Device Parameter OwnerUID Field is NULL");
            return;
        }

        this.clientDeviceMap[obj.UID] = obj;
        this.clientDeviceMapByOwner[obj.OwnerUID] = obj;
    }

    UpdateStackToken(obj){
        if(IsNull(obj)){
            WarningLog("Update Stack Token Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Update Stack Token Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Update Stack Token Parameter OwnerUID Field is NULL");
            return;
        }

        this.stackTokenMap[obj.UID] = obj;
        var stackTokenList = this.stackTokenMapByOwner[obj.OwnerUID];
        if(!IsNull(stackTokenList) && stackTokenList != undefined){
            for(var stackToken of stackTokenList){
                if(stackToken.UID == obj.UID)
                    stackToken = obj;
            }
        }
    }

    UpdatePost(obj){
        if(IsNull(obj)){
            WarningLog("Update Post Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Update Post Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Update Post Parameter OwnerUID Field is NULL");
            return;
        }

        this.postMap[obj.UID] = obj;

        var ownerPostList = this.postMapByOwnerUID[obj.OwnerUID];
        if(!IsNull(ownerPostList) && ownerPostList != undefined){
            for(var post of ownerPostList){
                if(post.UID == obj.UID)
                    post = obj;
            }
        }

        this.ReconstructPostByStatusMap()
    }

    UpdateMsg(obj){
        if(IsNull(obj)){
            WarningLog("Update Msg Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Update Msg Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Update Msg Parameter OwnerUID Field is NULL");
            return;
        }

        this.msgMap[obj.UID] = obj;
        var msgList = this.msgMapByOwnerUID[obj.OwnerUID];
        if(!IsNull(msgList) && msgList != undefined){
            for(var msg of msgList){
                if(msg.UID == obj.UID)
                    msg = obj;
            }
        }
    }

    UpdateLocalization(obj){
        if(IsNull(obj)){
            WarningLog("Update Localization Parameter is NULL");
            return;
        }

        this.localizationMap[obj.ID] = obj;
    }
    //#endregion

    //#region Delete
    //====================================================================================
    DeleteAccount(obj){
        if(IsNull(obj)){
            WarningLog("Delete Account Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Delete Account Parameter UID Field is NULL");
            return;
        }

        delete this.accountMap[obj.UID];
        delete this.accountMapByEmail[obj.Email];
    }

    DeleteProfile(obj){
        if(IsNull(obj)){
            WarningLog("Delete Profile Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Delete Profile Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Delete Profile Parameter OwnerUID Field is NULL");
            return;
        }

        delete this.profileMap[obj.UID];
        delete this.profileMapByOwner[obj.OwnerUID];
        delete this.profileMapByPhoneNumber[obj.PhoneNumber];
    }

    DeleteClientDevice(obj){
        if(IsNull(obj)){
            WarningLog("Delete Client Device Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Delete Client Device Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Delete Client Device Parameter OwnerUID Field is NULL");
            return;
        }

        delete this.clientDeviceMap[obj.UID];
        delete this.clientDeviceMapByOwner[obj.OwnerUID];
        /*
        var clientDeviceList = this.clientDeviceMapByOwner[obj.OwnerUID];
        if(!IsNull(clientDeviceList) && clientDeviceList != undefined){            
            for(let i = 0; i < clientDeviceList.length; i++){
                var clientDevice = clientDeviceList[0];
                if(clientDevice.UID == obj.UID){
                    clientDeviceList.splice(i,1);
                    break;
                }
            }
        }
        */
    }

    DeleteStackToken(obj){
        if(IsNull(obj)){
            WarningLog("Delete Stack Token Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Delete Stack Token Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Delete Stack Token Parameter OwnerUID Field is NULL");
            return;
        }

        delete this.stackTokenMap[obj.UID];
        var stackTokenList = this.stackTokenMapByOwner[obj.OwnerUID];
        if(!IsNull(stackTokenList) && stackTokenList != undefined){
            for(let i = 0; i < stackTokenList.length; i++){
                var stackToken = stackTokenList[0];
                if(stackToken.UID == obj.UID){
                    stackTokenList.splice(i,1);
                    break;
                }
            }
        }
    }

    DeletePost(obj){
        if(IsNull(obj)){
            WarningLog("Delete Post Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Delete Post Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Delete Post Parameter OwnerUID Field is NULL");
            return;
        }
        

        delete this.postMap[obj.UID];
        var postList = this.postMapByOwnerUID[obj.OwnerUID];
        if(!IsNull(postList) && postList != undefined){
            for(let i = 0; i < postList.length; i++){
                var post = postList[i];
                if(post.UID == obj.UID){
                    postList.splice(i,1);
                    this.postMapByOwnerUID[obj.OwnerUID]=postList;
                    break;
                }
            }
        }
        var statusPostList = this.postMapByStatus[obj.Status];
        if(!IsNull(statusPostList) && statusPostList != undefined){
            for (let i = 0; i< statusPostList.length; i++){
                var post = statusPostList[i];
                if(post.UID == obj.UID){
                    statusPostList.splice(i,1);
                    this.postMapByStatus[obj.Status]=statusPostList;
                    break;
                }
            }
        }
    }

    DeleteMsg(obj){
        if(IsNull(obj)){
            WarningLog("Delete Msg Parameter is NULL");
            return;
        }

        if(IsNull(obj.UID)){
            WarningLog("Delete Msg Parameter UID Field is NULL");
            return;
        }

        if(IsNull(obj.OwnerUID)){
            WarningLog("Delete Msg Parameter OwnerUID Field is NULL");
            return;
        }
        

        delete this.msgMap[obj.UID];
        var msgList = this.msgMapByOwnerUID[obj.OwnerUID];
        if(!IsNull(msgList) && msgList != undefined){
            for(let i = 0; i < msgList.length; i++){
                var msg = msgList[0];
                if(msg.UID == obj.UID){
                    msgList.splice(i,1);
                    break;
                }
            }
        }
    }

    DeleteLocalization(obj){
        if(IsNull(obj)){
            WarningLog("Delete Localization Parameter is NULL");
            return;
        }

        delete this.localizationMap[obj.ID];
    }
    //#endregion
    
    //#region UID
    //====================================================================================
    GetAccountUID(){
        this.accountUID++;
        return this.accountUID;
    }

    GetProfileUID(){
        this.profileUID++;
        return this.profileUID;
    }

    GetStackTokenUID(){
        this.stackTokenUID++;
        return this.stackTokenUID;
    }

    GetClientDeviceUID(){
        this.clientDeviceUID++;
        return this.clientDeviceUID;
    }

    GetPostUID(){
        this.postUID++;
        return this.postUID;
    }

    GetMsgUID(){
        this.msgUID++;
        return this.msgUID;
    }
    //#endregion

    ReconstructProfileByStatusMap(){
        this.profileMapByStatus = {};

        for(const[key, value] of Object.entries(this.profileMap)){

            var statusProfileList = this.profileMapByStatus[value.Status]
            if(IsNull(statusProfileList)|| statusProfileList == undefined){
                statusProfileList = [];
                this.profileMapByStatus[value.Status] = statusProfileList
            }
            statusProfileList.push(value);
        }
    }

    ReconstructPostByStatusMap(){
        this.postMapByStatus = {};

        for(const[key, value] of Object.entries(this.postMap)){

            var statusPostList = this.postMapByStatus[value.Status]
            if(IsNull(statusPostList) || statusPostList == undefined){
                statusPostList = [];
                this.postMapByStatus[value.Status] = statusPostList;
            }
            statusPostList.push(value);
            statusPostList.sort((a,b)=>{
                if(a.CreateTime > b.CreateTime){
                    return 1;
                }
                else if(a.CreateTime < b.CreateTime){
                    return -1;
                }
                return 0;
            });
        }
    }
}

class Singleton{
    constructor(){
        if(!Singleton.instance){
            Singleton.instance = new DataManager();
        }
    }
    
    Instance(){
        return Singleton.instance;
    }
}

module.exports = Singleton;

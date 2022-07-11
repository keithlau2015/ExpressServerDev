const router = require("express").Router();
const jwt = require ('jsonwebtoken');

const DataManager = require('../DataManager');
const DatabaseManager = require('../DatabaseManager');

const { tokenVerify } = require("../Utils/authToken");
const { ErrorLog, SystemLog, DebugLog } = require("../Utils/DebugUtility");
const CommonUtility = require("../Utils/CommonUtility");
const BasicUserAction = require('../Feature/BasicUserAction');

var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();


//get all post for client-side's post list page
router.post("/getPost", async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });
    
    //dataObj = [];
    // for (let i = 0; i < dataManager.postUID; i++) {
    //     var data = dataManager.postMap[i+1]
    //     if (data.Status == 1){
    //         dataObj [i] = dataManager.postMap[i+1];
    //     }
    //     //Object.assign(dataObj, {[i]: dataManager.postMap[i]})  
    // }

    var dataObj = dataManager.postMapByStatus[1];

    try{
        jwt.verify(req.header('auth_token'), "123");
    }catch(err){
        //Tell Client-Side display incomplete content if auth token not work
        return res.status(210).json(dataObj);
    }

    //Tell Client-Side Display Complete Content
    return res.status(200).json(dataObj);
     
    /*
    dataObj = {};
    jsonObj = {};
    for (let i = 1; i <= dataManager.postUID; i++) {
        Object.assign(jsonObj, 
            {title: dataManager.postMap[i].Title,
            content: dataManager.postMap[i].Content})
        Object.assign(dataObj, {[i]: jsonObj})
    }
    return res.status(200).json(dataObj);
    */    
})

// get individual post
router.post ('/getPost/:id', async (req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var targetPost = dataManager.postMap[req.params.id]

    if (targetPost.Status != 1) return res.status(404).json("This Job is not published yet.")
    
    try{
        jwt.verify(req.header('auth_token'), "123");
    }catch(err){
        //display incomplete content
        return res.status(210).json(targetPost);
    }
    //Display Complete Content 
    return res.status(200).json(targetPost);
})

//create post
router.post('/addPost', tokenVerify, async(req,res)=>{
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.Logout;
    requestLog.Param = `Account UID: ${req.user.UID}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });
    DebugLog(`${req.body}`);
    const result = await BasicUserAction.AddPost(req.user.UID, req.body.title, req.body.contract_status, req.body.skills, req.body.holiday, req.body.address, req.body.location, req.body.salary, req.body.unit_size, req.body.other_maid, req.body.overseas, req.body.share_bed, req.body.accommodation, req.body.language, req.body.first_day, req.body.deadline, req.body.description, req.body.gender, req.body.experience);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

//get all post of logged-in user
router.post('/myPost', tokenVerify, async(req,res)=>{
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetSelfPost;
    requestLog.Param = `Acct UID: ${req.user.UID}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var postList = dataManager.postMapByOwnerUID[req.user.UID];
    if(!postList){
        return res.status(204).send('No Post Created Yet...');
    }
    return res.status(200).json(postList);   
});

//update post
router.post('/updatePost', tokenVerify, async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Acct UID: ${req.user.UID}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.EditPost(req.body.UID, req.body.title, req.body.contract_status, req.body.skills, req.body.holiday, req.body.location, req.body.salary, req.body.unit_size, req.body.other_maid, req.body.overseas, req.body.share_bed, req.body.accommodation, req.body.language, req.body.first_day, req.body.deadline, req.body.description, req.body.address, req.body.gender, req.body.experience);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/deletePost', tokenVerify, async(req,res)=>{
    /*
    var requestLog = new databaseManager.RequestLogModel();

    var targetPost = dataManager.postMap[req.body.postuid];

    targetPost.delete((err,result)=>{
        if(err) return console.error(err);
        dataManager.DeletePost();
    })
    */

    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Acct UID: ${req.user.UID}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.DeletePost(req.body.UID);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/deletePostCMS/:id', async(req,res)=>{
    /*
    var requestLog = new databaseManager.RequestLogModel();

    var targetPost = dataManager.postMap[req.body.postuid];

    targetPost.delete((err,result)=>{
        if(err) return console.error(err);
        dataManager.DeletePost();
    })
    */

    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Acct UID: Admin`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.DeletePost(req.params.id);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/getHelpers', async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip
;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    var dataObj = dataManager.profileMapByStatus[1];

    try{
        jwt.verify(req.header('auth_token'), "123");
    }catch(err){
        //Tell Client-Side display incomplete content if auth token not work
        return res.status(210).json(dataObj);
    }

    //Tell Client-Side Display Complete Content
    return res.status(200).json(dataObj);
   
    dataObj = [];
    for (let i = 1; i <= dataManager.profileUID; i++) {
        dataObj [i-1] = dataManager.profileMap[i];
    }

    try{
        jwt.verify(req.header('auth_token'), "123");
    }catch(err){
        /*
        //display incomplete content
        dataObj = {};
        jsonObj = {};
        for (let i = 1; i <= dataManager.profileUID; i++) {
            Object.assign(jsonObj, 
                {title: dataManager.profileMap[i].UID,
                content: dataManager.profileMap[i].Height})
            Object.assign(dataObj, {[i]: jsonObj})
        }
        return res.status(200).json(dataObj);
        */

        //Display Complete Content 
        
        return res.status(210).json(dataObj);
    }
    /*
    //Display Complete Content 
    dataObj = {};
    for (let i = 1; i <= dataManager.profileUID; i++) {
        Object.assign(dataObj, {[i]: dataManager.profileMap[i]})
    }
    return res.status(200).json(dataObj);
    */
    return res.status(200).json(dataObj);
   
})

router.post("/getHelpers/:id", async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    // get individual helper if client-side provide [id]
    var targetHelper = dataManager.profileMap[req.params.id]

    if(targetHelper.Status != 1) return res.status(404).json("This Helper is not published yet.");
    try{
        jwt.verify(req.header('auth_token'), "123");
    }catch(err){
        //display incomplete content       
        dataObj = {};
        dataObj.first_name = targetHelper.FirstName;
        dataObj.last_name = targetHelper.LastName;
        dataObj.nationality = targetHelper.Nationality;
        dataObj.birth = targetHelper.Birth;
        dataObj.height = targetHelper.Height;
        dataObj.weight = targetHelper.Weight;
        dataObj.education = targetHelper.Education;
        dataObj.religion = targetHelper.Religion;
        dataObj.language = targetHelper.Language;
        dataObj.skills = targetHelper.Duties;
        return res.status(210).json(targetHelper);
                
    }
    //Display Complete Content 
    return res.status(200).json(targetHelper);
})

router.post("/helper/like", tokenVerify, async (req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.LikeHelper(req.user.UID, req.body.UID);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post("/post/like", tokenVerify, async (req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.LikePost(req.user.UID, req.body.UID);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/GetLikedPost', tokenVerify, async(req,res)=>{
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};

    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const targetUser = dataManager.profileMap[req.user.UID];
    if(targetUser.ShortList!=undefined && targetUser.ShortList!=null){
        const shortlist = targetUser.ShortList;

        var postsObj = [];
        for(let i = 0; i<shortlist.length;i++){
            var post = dataManager.postMap[shortlist[i]];
            if(post.Status == 1)
                postsObj.push(post);
        }
    }
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(postsObj);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/GetLikedHelper', tokenVerify, async(req,res)=>{
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const targetUser = dataManager.profileMap[req.user.UID];
    if(targetUser.ShortList!=undefined && targetUser.ShortList!=null){
        const shortlist = targetUser.ShortList;

        var helpersObj = [];
        for(let i = 0; i<shortlist.length;i++){
            var post = dataManager.profileMap[shortlist[i]];
            if(post == null || post == undefined) continue
            if(post.Status == null) continue
            if(post.Status == 1) helpersObj.push(post);
        }
    
    }
    
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(helpersObj);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post("/helper/apply", tokenVerify, async (req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.HireHelper(req.user.UID, req.body.UID, req.body.lang);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post("/post/apply", tokenVerify, async (req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.ApplyPost(req.user.UID, req.body.UID, req.body.lang);

    //外傭
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(result.msg);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/sharePost', async(req,res)=>{
    //0x0a next line
    const site = "http://192.168.50.149:3000"
    const TargetPost = dataManager.postMap[req.body.UID]
    let original;
    
    if(req.body.lang == 'HK') original = dataManager.localizationMap["999997"].LangHK;
    else if(req.body.lang == "EN") original = dataManager.localizationMap["999997"].LangEN;
    else if(req.body.lang == "ID") original = dataManager.localizationMap["999997"].LangID;
    else original = dataManager.localizationMap["999997"].LangEN;

    original = original.replace('${Title}', TargetPost.Title);
    original = original.replace('${nextline}', "\n")
    original = original.replace('${site}', site)
    original = original.replace('${UID}', TargetPost.UID);

    return res.status(200).json("https://wa.me/?text="+encodeURIComponent(original.trim()))  
})

router.post('/shareHelper', async(req,res)=>{
    //0x0a next line
    const site = "http://192.168.50.149:3000"
    const TargetHelper = dataManager.profileMap[req.body.UID]
    let original;
    
    if(req.body.lang == 'HK') original = dataManager.localizationMap["999996"].LangHK;
    else if(req.body.lang == "EN") original = dataManager.localizationMap["999996"].LangEN;
    else if(req.body.lang == "ID") original = dataManager.localizationMap["999996"].LangID;
    else original = dataManager.localizationMap["999996"].LangEN;

    original = original.replace('${Name}', TargetHelper.FirstName+" "+TargetHelper.LastName);
    original = original.replace('${nextline}', "\n")
    original = original.replace('${site}', site)
    original = original.replace('${UID}', TargetHelper.UID);

    return res.status(200).json("https://wa.me/?text="+encodeURIComponent(original.trim()))  
})


router.post('/GetAppliedPost', tokenVerify, async(req,res)=>{
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};

    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const targetUser = dataManager.profileMapByOwner[req.user.UID];
    if(targetUser.Applying!=undefined && targetUser.Applying!=null){
        const applying = targetUser.Applying;

        var postsObj = [];
        for(let i = 0; i<applying.length;i++){
            var post = dataManager.postMap[applying[i]];
            postsObj[i] = post;
        }
    }
    
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(postsObj);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})

router.post('/GetAppliedHelper', tokenVerify, async(req,res)=>{
    var result = { responseStatus: 200, errorCode: 0,  msg: {}};
    
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.GetAllPost;
    requestLog.Param = `auth_token: ${req.header('auth_token')}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const targetUser = dataManager.profileMap[req.user.UID];
    if (targetUser.Applying != undefined && targetUser.Applying != null){
        const applying = targetUser.Applying;

        var helpersObj = [];
        for(let i = 0; i<applying.length;i++){
            var post = dataManager.profileMap[applying[i]];
            helpersObj[i] = post;
        }
    }
    
    //success case
    if(result.responseStatus == 200){
        return res.status(200).json(helpersObj);
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
})
//update post
router.post('/updatePostCMS', async(req,res)=>{
    //Request Log
    var requestLog = new databaseManager.RequestLogModel();
    requestLog.IP = req.ip;
    requestLog.Platform = req.body.os_Name_Version;
    requestLog.Type = CommonUtility.RequestType.UpdateSelfPost;
    requestLog.Param = `Acct UID: ${req.body.UID}`;
    requestLog.save((err, result)=>{
        if(err) ErrorLog(err);
    });

    const result = await BasicUserAction.EditPostCMS(req.body.UID, req.body.action, req.body.field, req.body.data);

    //success case
    if(result.responseStatus == 200){
        return res.status(200).json({success: true});
    }
    //fail case
    else{
        return res.status(400).json(result.msg);
    }
});

module.exports = router;

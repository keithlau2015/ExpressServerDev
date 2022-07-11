//Import Modules
//=========================================================================================
const express = require('express');
var app = express();
const cors = require('cors');
const spawn = require("child_process").spawn;
const fileUpload = require('express-fileupload');
const expressWS = require('express-ws')(app);

//Import 自煮燃發 Modules
const DataManager = require('./DataManager');
const DatabaseManager = require('./DatabaseManager');
const {SystemLog, WarningLog, ErrorLog, DebugLog} = require('./Utils/DebugUtility');
const {PromiseChain, ObjSize, IsNull, GetMinutesIntervalTime, GetHoursIntervalTime, FeatureID, DirectoryPath} = require('./Utils/CommonUtility');

const userRoute = require('./Routes/User');
const contentRoute = require('./Routes/ContentRequest');
const cmsRoute = require('./Routes/CMS');
const postRoute = require('./Routes/Post');
const commonRequestRoute = require('./Routes/CommonRequest');  
//=========================================================================================

//Express Constructor
var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();
var server;
//Default Server ID
const ServerID = 0;

//Init Procedure
const INIT_SERVER_STEP = {
    0: "Connect to MongoDB",
    1: "Construct Collection Models",
    2: "Init dataManager",
    3: "Init Ban List",
    4: "Init Features",
    5: "Test Case",
    6: "Express Config",
}

//Server初始化起點
const InitProcedure = new Promise((resolve, reject) =>{
    SystemLog(`Starting Server`, {isStart: 0, TimerLabel: "Init Server Procedure"});
    SystemLog(`Init Server Step (0): ${INIT_SERVER_STEP[0]}`, {isStart: 0, TimerLabel: INIT_SERVER_STEP[0]});
    databaseManager.ConnectToDB(() => {
        SystemLog(null, {isStart: 1, TimerLabel: INIT_SERVER_STEP[0]});
        resolve(1);
    },
    (value) => {
        reject(value);
    });
});

InitProcedure.then(
    result => {
        SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`, {isStart: 0, TimerLabel: INIT_SERVER_STEP[result]});
        databaseManager.ModelConstructor();
        result++;
        return new PromiseChain(result);
    },
    error =>{
        ErrorLog(`Init Server Procedure rejected!`);
        ErrorLog(`Exception: ${error}`);
        ErrorLog(`Init Server ShutDown sequence`);

        GracefulShutdown();
    }
).then(
    result => {
        SystemLog(null, {isStart: 1, TimerLabel: INIT_SERVER_STEP[result-1]});
        SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`, {isStart: 0, TimerLabel: INIT_SERVER_STEP[result]});
        //Map Construct
        return databaseManager.LocalizationModel.find(function(err, dataList){
            if(err) ErrorLog(`${err}`);
            dataManager.ConstructLocalizationMap(dataList);
        }).then(x => {
            return databaseManager.TokenModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructTokenMap(dataList);
            });
        }).then(x => {
            return databaseManager.TagModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructTagMap(dataList);
            });
        }).then(x => {
            return databaseManager.ConditionModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructConditionMap(dataList);
            });
        }).then(x => {
            return databaseManager.ChoiceListModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructChoiceListMap(dataList);
            });
        }).then(x => {
            return databaseManager.AccountModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructAccountMap(dataList);
            });
        }).then(x => {
            return databaseManager.ClientDeviceModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructClientDeviceMap(dataList);
            });
        }).then(x => {
            return databaseManager.PostModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructPostMap(dataList);
            });
        }).then(x => {
            return databaseManager.ProfileModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructProfileMap(dataList);
            });
        }).then(x => {
            return databaseManager.StackTokenModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructStackTokenMap(dataList);
            });
        }).then(x => {
            return databaseManager.AccessControllistModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructAccessControllist(dataList);
            });
        }).then(x => {
            return databaseManager.ServerPropertiesModel.find(function(err, dataList){
                DebugLog(`${dataList}`);
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructServerProperties(dataList);
            });
        }).then(x =>{
            return databaseManager.FeatureModel.find(function(err, dataList){
                if(err) ErrorLog(`${err}`);
                dataManager.ConstructFeature(dataList);
            });
        }).then(x =>{
            SystemLog(null, {isStart: 1, TimerLabel: INIT_SERVER_STEP[result]});
            result++;
            return new PromiseChain(result);
        });
    },
    error => {
        ErrorLog(`Init Server Procedure rejected!`);
        ErrorLog(`Exception: ${error}`);
        ErrorLog(`Init Server ShutDown sequence`);

        GracefulShutdown();
    }
).then(
    result => {
        SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`, {isStart: 0, TimerLabel: INIT_SERVER_STEP[result]});
        for(const[key, value] of Object.entries(dataManager.banlist)){
            const IPBlocker = spawn('py', ["./Tools/IPBlocker.py", "-a " + value]);
            IPBlocker.stdout.on('data', (data)=>{
                DebugLog(`\n${data}`);
            });
        }
        SystemLog(``, {isStart: 1, TimerLabel: INIT_SERVER_STEP[result]});
        result++;
        return new PromiseChain(result);
    },
    error => {
        ErrorLog(`Init Server Procedure rejected!`);
        ErrorLog(`Exception: ${error}`);
        ErrorLog(`Init Server ShutDown sequence`);

        GracefulShutdown();
    }
).then(
    result => {
        SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`);
        
        result++;
        return new PromiseChain(result);
    },

    error => {
        ErrorLog(`Init Server Procedure rejected!`);
        ErrorLog(`Exception: ${error}`);
        ErrorLog(`Init Server ShutDown sequence`);

        GracefulShutdown();
    }
).then(
    result => {
        //SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`);
        SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`, {isStart: 0, TimerLabel: INIT_SERVER_STEP[result]});
        DebugLog(`Check Path: ${DirectoryPath.upload}`);
        SystemLog(``, {isStart: 1, TimerLabel: INIT_SERVER_STEP[result]});
        result++;
        return new PromiseChain(result);
    },

    error => {
        ErrorLog(`Init Server Procedure rejected!`);
        ErrorLog(`Exception: ${error}`);
        ErrorLog(`Init Server ShutDown sequence`);

        GracefulShutdown();
    }
).then(
    result => {
        //SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`);
        SystemLog(`Init Server Step (${result}): ${INIT_SERVER_STEP[result]}`, {isStart: 0, TimerLabel: INIT_SERVER_STEP[result]});
        //DebugLog(`Check Path: ${DirectoryPath.upload}`);
        app.use(express.json({limit: '5mb'}));
        SystemLog(``, {isStart: 1, TimerLabel: INIT_SERVER_STEP[result]});
        
        //app.use(express.urlencoded({limit: '5mb'}));
        result++;
        return new PromiseChain(result);
    },

    error => {
        ErrorLog(`Init Server Procedure rejected!`);
        ErrorLog(`Exception: ${error}`);
        ErrorLog(`Init Server ShutDown sequence`);

        GracefulShutdown();
    }
).then(
    result => {
        //======================================= Route ==========================================//
        //Middleware
        app.use(express.json());
        app.use(cors());
        app.use(fileUpload());
        app.use('/client/public', express.static(__dirname+'/client/public'))

        app.post('/upload', (req,res)=>{
            if (req.files === null) return res.status(200).send("No File Uploaded.")

            var pathList = {};
            if (req.files.avatar){
                const avatar = req.files.avatar;

                avatar.mv(`${__dirname}/client/public/uploads/${avatar.name}`, err=>{
                    console.error(err);
                    return res.status(500).send(err);
                })
                pathList.avatarPath = `/uploads/${avatar.name}`;
            }

            return res.status(200).json(pathList);
            // const file1 = req.files.file1;
            // const file2 = req.files.file2;
            // const file3 = req.files.file3;
            // const file4 = req.files.file4;.


            //console.log(JSON.stringify(req.body.text))
            //file1.mv(`${__dirname}/client/public/uploads/${file1.name}`, err=>{
            //    console.error(err);
            //    return res.status(500).send(err);
            //})
            // file2.mv(`${__dirname}/client/public/uploads/${file2.name}`, err=>{
            //     console.error(err);
            //     return res.status(500).send(err);
            // })
            // file3.mv(`${__dirname}/client/public/uploads/${file3.name}`, err=>{
            //     console.error(err);
            //     return res.status(500).send(err);
            // })
            // file4.mv(`${__dirname}/client/public/uploads/${file4.name}`, err=>{
            //     console.error(err);
            //     return res.status(500).send(err);
            // })
            // res.json({file1Path: `/uploads/${file.name}`,file2Path: `/uploads/${file2.name}`,file3Path: `/uploads/${file3.name}`,file4Path: `/uploads/${file4.name}` });
        })

        //route middleware
        //app.use('/', commonRequestRoute);
        app.use('/api/user', userRoute);
        app.use('/api/content', contentRoute);
        app.use('/CMS/api', cmsRoute);
        app.use('/api/post', postRoute);

        // app.use(express.static(path.join(__dirname, "/<front end app folder name>/build")));

        // app.get('*', (req, res) => {
        //     res.sendFile(path.join(__dirname, '/<front end app folder name>/build', 'index.html'));
        // });

        //========================================================================================//

        //======================================= Socket =========================================//
        app.ws('/CMS/api', cmsRoute);
        //========================================================================================//
        
        //====================================== Express =========================================//
        server = app.listen(3000, function() {
            SystemLog(`Server listening at http://127.0.0.1:3000`);
            SystemLog(null, {isStart: 1, TimerLabel: "Init Server Procedure"});
            //Set Interval Job
            setInterval(function(){
                DebugLog(`Start Cleaning Expired Verify Cache data`, {isStart: 0, TimerLabel: "Clear Pending Expired Verify Cache data"});
                var currentTimestamp = new Date();
                for(const[key, value] of Object.entries(dataManager.pendingVerifyUserMap)){
                    if(currentTimestamp.getUTCMilliseconds() >= value.ExpiredTime)
                        delete dataManager.pendingVerifyUserMap[key];
                }

                for(const[key, value] of Object.entries(dataManager.pendingVerifyForgetPasswordMap)){
                    if(currentTimestamp.getUTCMilliseconds() >= value.ExpiredTime)
                        delete dataManager.pendingVerifyForgetPasswordMap[key];
                }


                DebugLog(`Finished Interval Job`, {isStart: 1, TimerLabel: "Clear Pending Expired Verify Cache data"});
            }, GetMinutesIntervalTime(5));
            
            //every 24 hrs back up data once
            /*
            setInterval(function(){
                if(dataManager.serverFeatureData[FeatureID.AutoBackup] && dataManager.serverFeatureData[FeatureID.AutoBackup].isActive){
                    DebugLog(`Start Auto Backup`, {isStart: 0, TimerLabel: "AutoBackup"});
                    databaseManager.AutoBackup();
                    DebugLog(`Finished Interval Job`, {isStart: 1, TimerLabel: "AutoBackup"});
                }
            }, GetMinutesIntervalTime(dataManager.serverProperties[FeatureID.AutoBackup].Value));
            */
        });
        //========================================================================================//
    },
    error => {
        ErrorLog(`Init Server Procedure rejected!`);
        ErrorLog(`Exception: ${error}`);
        ErrorLog(`Init Server ShutDown sequence`);

        GracefulShutdown();
    }
);

//Close Server Procedure
async function GracefulShutdown(){
    if(IsNull(server))
    {
        SystemLog(`Server hasn't Init, Close Procedure Now`);
        process.exit();
    }

    server.close(() => {
        databaseManager.DBConnection.forEach(connection => {
            connection.close();
        });
        SystemLog(`Start Shutdown Server Procedure...`);
    });
}
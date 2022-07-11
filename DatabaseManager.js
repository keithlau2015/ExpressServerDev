const Mongoose = require('mongoose');
const FileSys = require('fs');
const DataSetSchema = require('./DatabaseSchema/DataSetSchema');
const SystemDataSchema = require('./DatabaseSchema/SystemDataSchema');
const LogSchema = require('./DatabaseSchema/LogSchema');
const ConfigSchema = require('./DatabaseSchema/ServerConfigSchema');
const {SystemLog, ErrorLog, DebugLog} = require('./Utils/DebugUtility');
const { IsNull } = require('./Utils/CommonUtility');

class DatabaseManager{
    constructor(){
        this.DBName = ['SystemData', 'DataSet', 'SystemConfig', 'Log'];
        this.DBSetting = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
        this.DBConnectionStatus = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnected",
            4: "error"
        }
        // this.url = "mongodb://localhost:27017";
        this.url = "mongodb+srv://cimptech:!Yx318it699@helperscloud.zkn3g.mongodb.net"
        //cache db connection
        this.DBConnection = {};
        //caching System Data models
        this.AccountModel;
        this.ProfileModel;
        this.ClientDeviceModel;
        this.StackTokenModel;
        this.MsgModel;
        this.PostModel;

        //caching Data Set models
        this.LocalizationModel;
        this.TokenModel;
        this.ChoiceListModel;
        this.ConditionModel;
        this.TagModel;

        //caching Log models
        this.AccountLogModel;
        this.RequestLogModel;
        
        //caching Config models
        this.AccessControllistModel;
        this.FeatureModel;
        this.ServerPropertiesModel;
    }

    async ConnectToDB(successCB, failedCB){
        var totalConnectedDB = 0;
        return Mongoose.createConnection(`${this.url}/${this.DBName[totalConnectedDB]}`, this.DBSetting).then(result => {
            if(this.DBConnectionStatus[result.readyState] == this.DBConnectionStatus[1]){
                DebugLog(`${this.DBName[totalConnectedDB]} DB Connection Successful!`);
                this.DBConnection[this.DBName[totalConnectedDB]] = result;
                totalConnectedDB++;
            }
            result.on(this.DBConnectionStatus[4], function(err){
                ErrorLog(`System Data DB Connection Issue => ${err}`);
                reject(totalConnectedDB);
            });
            return Mongoose.createConnection(`${this.url}/${this.DBName[totalConnectedDB]}`, this.DBSetting).then(result => {
                if(this.DBConnectionStatus[result.readyState] == this.DBConnectionStatus[1]){
                    DebugLog(`${this.DBName[totalConnectedDB]} DB Connection Successful!`);
                    this.DBConnection[this.DBName[totalConnectedDB]] = result;
                    totalConnectedDB++;
                }
                result.on(this.DBConnectionStatus[4], function(err){
                    ErrorLog(`Data Set DB Connection Issue => ${err}`);
                    reject(totalConnectedDB);
                });
                return Mongoose.createConnection(`${this.url}/${this.DBName[totalConnectedDB]}`, this.DBSetting).then(result =>{
                    if(this.DBConnectionStatus[result.readyState] == this.DBConnectionStatus[1]){
                        DebugLog(`${this.DBName[totalConnectedDB]} DB Connection Successful!`);
                        this.DBConnection[this.DBName[totalConnectedDB]] = result;
                        totalConnectedDB++;                        
                    }
                    result.on(this.DBConnectionStatus[4], function(err){
                        ErrorLog(`System Config DB Connection Issue => ${err}`);
                        reject(totalConnectedDB);
                    });
                    return Mongoose.createConnection(`${this.url}/${this.DBName[totalConnectedDB]}`, this.DBSetting).then(result => {
                        if(this.DBConnectionStatus[result.readyState] == this.DBConnectionStatus[1]){
                            DebugLog(`${this.DBName[totalConnectedDB]} DB Connection Successful!`);
                            this.DBConnection[this.DBName[totalConnectedDB]] = result;
                            totalConnectedDB++;
                            if(totalConnectedDB == this.DBName.length){
                                if(!IsNull(successCB) && typeof successCB == "function")
                                    successCB();
                            }                            
                            else
                                if(!IsNull(failedCB) && typeof failedCB == "function")
                                    failedCB(totalConnectedDB)
                        }
                        result.on(this.DBConnectionStatus[4], function(err){
                            ErrorLog(`Data Set DB Condwnection Issue => ${err}`);
                            reject(totalConnectedDB);
                        });
                    });
                });
            });
        });
    }

    ModelConstructor(){
        this.AccountModel = this.DBConnection[this.DBName[0]].model('account', SystemDataSchema.AccountSchema);
        this.ProfileModel = this.DBConnection[this.DBName[0]].model('profile', SystemDataSchema.ProfileSchema);
        this.ClientDeviceModel = this.DBConnection[this.DBName[0]].model('clientdevice', SystemDataSchema.ClientDeviceSchema);
        this.StackTokenModel = this.DBConnection[this.DBName[0]].model('stacktoken', SystemDataSchema.StackTokenSchema);
        this.PostModel = this.DBConnection[this.DBName[0]].model('post', SystemDataSchema.PostSchema);
        this.MsgModel = this.DBConnection[this.DBName[0]].model('msg', SystemDataSchema.MsgSchema);
        //this.PostModel = this.DBConnection[this.DBName[0]].model('post', SystemDataSchema.PostSchema)

        this.LocalizationModel = this.DBConnection[this.DBName[1]].model('localization', DataSetSchema.LocalizationSchema);
        this.TokenModel = this.DBConnection[this.DBName[1]].model('token', DataSetSchema.TokenSchema);
        this.ConditionModel = this.DBConnection[this.DBName[1]].model('condition', DataSetSchema.ConditionSchema);
        this.ChoiceListModel = this.DBConnection[this.DBName[1]].model('choicelist', DataSetSchema.ChoiceListSchema);
        this.TagModel = this.DBConnection[this.DBName[1]].model('tag', DataSetSchema.TagSchema);

        this.AccessControllistModel = this.DBConnection[this.DBName[2]].model('accesscontrollist', ConfigSchema.AccessControllistSchema);
        this.FeatureModel = this.DBConnection[this.DBName[2]].model('feature', ConfigSchema.FeatureSchema);
        this.ServerPropertiesModel = this.DBConnection[this.DBName[2]].model('serverproperties', ConfigSchema.ServerPropertiesSchema);

        this.AccountLogModel = this.DBConnection[this.DBName[3]].model('accountlog', LogSchema.AccountLogSchema);
        this.RequestLogModel = this.DBConnection[this.DBName[3]].model('requestlog', LogSchema.RequestLogSchema);
    }

    AutoBackup(){
        const dateObj = Date.now();
        if(!FileSys.existsSync(`./Backup`))
            FileSys.mkdirSync(`./Backup`);
        FileSys.mkdirSync(`./Backup/${dateObj}`);
        this.AccountModel.find(function(err, result) { 
            if (err) ErrorLog(err); 
            var fileName = `./Backup/${dateObj}/AccountDataBackup.json`;  
            FileSys.writeFile(fileName, JSON.stringify(result), (fserr) => { if(fserr) ErrorLog(fserr); });
        });
        this.ProfileModel.find(function(err, result) { 
            if (err) ErrorLog(err); 
            var fileName = `./Backup/${dateObj}/ProfileDataBackup.json`;  
            FileSys.writeFile(fileName, JSON.stringify(result), (fserr) => { if(fserr) ErrorLog(fserr); });
        });
        this.ClientDeviceModel.find(function(err, result) { 
            if (err) ErrorLog(err); 
            var fileName = `./Backup/${dateObj}/ClientDeviceDataBackup.json`;  
            FileSys.writeFile(fileName, JSON.stringify(result), (fserr) => { if(fserr) ErrorLog(fserr); });
        });
        this.StackTokenModel.find(function(err, result) { 
            if (err) ErrorLog(err); 
            var fileName = `./Backup/${dateObj}/StackTokenDataBackup.json`;  
            FileSys.writeFile(fileName, JSON.stringify(result), (fserr) => { if(fserr) ErrorLog(fserr); });
        });
        this.PostModel.find(function(err, result) { 
            if (err) ErrorLog(err); 
            var fileName = `./Backup/${dateObj}/PostDataBackup.json`;  
            FileSys.writeFile(fileName, JSON.stringify(result), (fserr) => { if(fserr) ErrorLog(fserr); });
        });
        this.MsgModel.find(function(err, result) { 
            if (err) ErrorLog(err); 
            var fileName = `./Backup/${dateObj}/MsgDataBackup.json`;  
            FileSys.writeFile(fileName, JSON.stringify(result), (fserr) => { if(fserr) ErrorLog(fserr); });
        });
    }
}

class Singleton{
    constructor(){
        if(!Singleton.instance){
            Singleton.instance = new DatabaseManager();
        }
    }
    
    Instance(){
        return Singleton.instance;
    }
}

module.exports = Singleton;

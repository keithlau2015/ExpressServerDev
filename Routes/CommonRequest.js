const router = require("express").Router();
const DataManager = require('../DataManager');
const DatabaseManager = require('../DatabaseManager');
const CommonUtility = require('../Utils/CommonUtility');
const {SystemLog, WarningLog, ErrorLog, DebugLog} = require('../Utils/DebugUtility');

var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();

router.all((req, res) => {
    
});
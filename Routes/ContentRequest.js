const router = require("express").Router();

const {tokenVerify} = require('../Utils/authToken');
const DataManager = require('../DataManager');
const DatabaseManager = require('../DatabaseManager');

var dataManager = new DataManager().Instance();
var databaseManager = new DatabaseManager().Instance();

router.post("/01",tokenVerify, async (req,res) =>{
  //providing appropriate language
  if(req.body.lang == "HK"){
    return res.status(200).json({
      "a010100" : dataManager.localizationMap["010100"].LangHK,
      "a010101" : dataManager.localizationMap["010101"].LangHK
    })
  }
  if(req.body.lang == "EN"){
    return res.status(200).json({
      "a010100" : dataManager.localizationMap["010100"].LangEN,
      "a010101" : dataManager.localizationMap["010101"].LangEN
    })
  }
  if(req.body.lang == "ID"){
    return res.status(200).json({
      "a010100" : dataManager.localizationMap["010100"].LangID,
      "a010101" : dataManager.localizationMap["010101"].LangID
    })
  }
  return res.status(400).send('Bad Language Setting...')
})  


router.post('/id', async(req,res)=>{
  //check if client side is authorized or not
  if (req.body.auth !== "123"){
    return res.status(401).send('unauthorized')
  }

  var dataObj = {};
  
  var arrayObj = {};

  //providing appropriate language
  if(req.body.lang == "HK"){
    for (var i = 0 ; i < (req.body.id).length ; i++){
      var key = "a"+ req.body.id[i];
      Object.assign(dataObj,{[key]: dataManager.localizationMap[req.body.id[i]].LangHK})
    }
    return res.status(200).json(dataObj);
  }

  if(req.body.lang == "EN"){
    // dataObj["data"]=[];
    for (var i = 0 ; i < (req.body.id).length ; i++){
      var key = "a"+ req.body.id[i];
      Object.assign(dataObj,{[key]: dataManager.localizationMap[req.body.id[i]].LangEN})
      // arrayObj = {};
      // Object.assign(arrayObj, {"id": req.body.id[i], "content":dataManager.localizationMap[req.body.id[i]].LangEN});
      // dataObj["data"].push(arrayObj);
    }
    return res.status(200).json(dataObj);
  }

  if(req.body.lang == "ID"){
    for (var i = 0 ; i < (req.body.id).length ; i++){
      var key = "a"+ req.body.id[i];
      Object.assign(dataObj,{[key]: dataManager.localizationMap[req.body.id[i]].LangID})
    }
    return res.status(200).json(dataObj);
  }
  
  return res.status(400).send('Bad Language Setting...')
})
module.exports = router;
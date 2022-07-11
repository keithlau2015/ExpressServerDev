const mongoose = require('mongoose');
const DataManager = require('../DataManager');

const dataManager = new DataManager().Instance();

const AccountLogSchema = new mongoose.Schema({
    AcctUID: {
        type: Number,
        required: true,
    },
    ActionType:{
        type: String,
        default: ""
    },
    ActionParam: {
        type: String,
        default: ""
    },
    CreateTime: {
        type: Date,
        default: Date.now
    }
});

const RequestLogSchema = new mongoose.Schema({
    IP: {
        type: String,
        //required: true,
    },
    Platform:{
        type: String,
        //required: true,
    },
    Type:{
        type: Number,
        //required: true
    },
    Param: {
        type: String,
        default: ""
    },
    CreateTime: {
        type: Date,
        default: Date.now
    }
});

module.exports = {
    AccountLogSchema, RequestLogSchema
}
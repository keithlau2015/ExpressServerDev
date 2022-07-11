const mongoose = require('mongoose');

const AccessControllistSchema = new mongoose.Schema({
    AcctUID: {
        type: Number,
        required: true,
    },
    IP: {
        type: String,
        required: true,
    },
    Type: {
        type: Number,
        required: true,
        default: 0
    },
});

const FeatureSchema = new mongoose.Schema({
    ID: {
        type: Number,
        required: true,
    },

    GroupID: {
        type: Number,
        require: true,
    },

    isActive: {
        type: Boolean,
        required: true,
        default: false
    },

    DescriptionID: {
        type: String,
        default: ""
    },
    
    ConditionID: {
        type: Number,
        default: -1
    },
});

const TestCaseSchema = new mongoose.Schema({
    ID: {
        type: Number,
        required: true,
    },
    
    RequestType: {
        type: Number,
        required: true,
    },
    
    ConditionID: {
        type: Number,
        required: true,
    },
    
    isFatal: {
        type: Boolean,
        default: false
    }
});

const ServerPropertiesSchema = new mongoose.Schema({
    Domain:{
        type: String
    },
    ID: {
        type: String,
        required: true,
    },
    IP:{
        type: String
    },
    ModuleList: {
        type: String,
    },
    Port:{
        type: String
    },
    Remark:{
        type: String
    },
    ServerName: {
        type: String
    },
    ServerOpenTime:{
        type: String
    },
    EmailHost:{
        type: String
    },
    EmailUsername:{
        type: String
    },
    EmailPassword:{
        type: String
    },
    EmailPort:{
        type: Number
    },
    EmailSSL:{
        type: Boolean
    },
});

module.exports = {
    FeatureSchema, AccessControllistSchema, ServerPropertiesSchema
}

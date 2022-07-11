const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    ID: {
        type: Number,
        required: true,
        default: 0
    },
    Value: {
        type: Number,
        default: 0
    },
    DescriptionID:{
        type: Number,
        default: 0
    },
    TimeSchedulerID:{
        type: Number,
        default: 0
    },
    IconPath:{
        type: String,
        default: ""
    },
    Remark:{
        type: String,
        default: ""
    },
    UpdateTime: {
        type: Date,
        default: Date.now
    }
});

const LocalizationSchema = new mongoose.Schema({
    ID: {
        type: String,
        required: true,
        default: ""        
    },
    LangHK: {
        type: String,
        default: ""
    },
    LangTW: {
        type: String,
        default: ""
    },
    LangCN:{
        type: String,
        default: ""
    },
    LangEN:{
        type: String,
        default: ""
    },
    LangKR:{
        type: String,
        default: ""
    },
    LangJP:{
        type: String,
        default: ""
    },
    LangID:{
        type: String,
        default: ""
    },
    UpdateTime: {
        type: Date,
        default: Date.now
    }
});

const ConditionSchema = new mongoose.Schema({
    ID: {
        type: Number,
        required: true,     
    },
    CondType: {
        type: Number,
        default: 0
    },
    CondSubType: {
        type: Number,
        default: 0
    },
    CondID:{
        type: Number,
        default: 0
    },
    CondValue:{
        type: Number,
        default: 0
    },
    ConditionOperator:{
        type: Number,
        default: 0
    },
    ExpendCondID:{
        type: Number,
    },
    UpdateTime: {
        type: Date,
        default: Date.now
    }
});

const ChoiceListSchema = new mongoose.Schema({
    ID: {
        type: Number,
        required: true,     
    },
    GroupID: {
        type: Number,
        required: true,
    },
    DescriptionID: {
        type: Number,
        default: 0
    },
    ExpendChoiceListID: {
        type: Number,
        default: 0
    },
    Order:{
        type: Boolean,
        default: true
    },
    UpdateTime: {
        type: Date,
        default: Date.now
    }
});

const TagSchema = new mongoose.Schema({
    ID: {
        type: Number,
        required: true,     
    },
    DescriptionID: {
        type: Number,
        default: 0
    },
    Value: {
        type: Number,
    },
    UpdateTime: {
        type: Date,
        default: Date.now
    }
});

module.exports = {
    TokenSchema, LocalizationSchema, ConditionSchema, ChoiceListSchema, TagSchema
}

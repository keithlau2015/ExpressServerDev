const { boolean, string } = require('joi');
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    UID: {
        type: Number,
        required: true,
    },
    Authority: {
        type: Number,
        default: 0
    },
    LastLoginTime: {
        type: Number,
        default: ""
    },
    Email:{
        type: String,
        required: true,
        default: ""
    },
    Password:{
        type: String,
        default: ""
    },
    CreateTime: {
        type: Number,
        default: Date.now
    }
});

const ClientDeviceSchema = new mongoose.Schema({
    UID: {
        type: Number,
        required: true,
    },
    OwnerUID: {
        type: Number,
        required: true,
        default: 0
    },
    DeviceType: {
        type: String,
        default: ""
    },
    OS:{
        type: String,
        default: ""
    },
    IP:{
        type: String,
        default: ""
    },
});
/*
const PostSchema = new mongoose.Schema({
    UID: {
        type: Number,
        required: true,
    },
    OwnerUID: {
        type: Number,
        required: true,
    },
    Title: {
        type: String,
        default: ""
    },
    Content:{
        type: String,
        default: ""
    },
    ExpendPostUID:{
        type: Number
    },
    ExpiredTime:{
        type: Number,
        default: Date.now
    },
});
*/
const ProfileSchema = new mongoose.Schema({
    UID: {
        type: Number,
        required: true,
    },
    OwnerUID: {
        type: Number,
        required: true,
        default: 0
    },
    Email: {
        type: String,
        required: true
    },
    Authority:{
        type: Number,
        required: true
    },
    FirstName:{
        type: String,
        default: ""
    },
    LastName:{
        type: String,
        default: ""
    },
    PhoneNumber:{
        type: String,
        default: ""
    },
    Birth:{
        type: Number
    },
    BIO:{
        type: String,
        default: ""
    },
    UpdateTime:{
        type: Number,
        default: Date.now
    },
    AvatarIconPath:{
        type: String,
        default: ""
    },
    Gender: {
        type: String
    },
    Location:{
        type: String
    },
    Address:{
        type: Array
    },
    ContractStatus:{
        type: Number
    },
    AvailableDate: {
        type: Number
    },
    Nationality:{
        type: String,
        default: ""
    },
    Education:{
        type: String,
        default: ""
    },
    Religion:{
        type: String,
        default: ""
    },
    Marriage:{
        type: String,
        default: ""
    },
    Spouse:{
        type: String,
    },
    NumOfChild:{
        type: Number,
    },
    Weight:{
        type: Number,
        default: ""
    },
    Height:{
        type: Number,
        default: ""
    },
    Language:{
        type: Array,
        default: ""
    },
    Intro:{
        type: String
    },
    NonDomesticExp:{
        type: Array
    },
    DomesticExp:{
        type: Array
    },
    Skills:{
        type: Array
    },
    Priority:{
        type: Array
    },
    Info:{
        type: Array
    },
    Salary: {
        type: Number
    },
    Doc:[{
        type: String
    }],
    Pics:[{
        type: String
    }],
    Declaration:{
        type: Boolean,
        default: false
    },
    Status:{
        type: Number,
        default: -1
    },
    ShortList:{
        type: Array,
        default: []
    },
    FavoritedBy:{
        type: Array
    },
    AppliedBy:{
        type: Array
    },
    Applying:{
        type: Array,
        default: []
    },
    AccessControlStatus:{
        type: Number,
    },
    AppliedTime:{
        type: Number,
        default: Date.now
    }
});

const StackTokenSchema = new mongoose.Schema({
    UID: {
        type: Number,
        required: true,
    },
    OwnerUID: {
        type: Number,
        required: true,
        default: 0
    },
    Type: {
        type: Number,
        require: true
    },
    ID: {
        type: Number,
        required: true,
        default: 0
    },
    Count:{
        type: Number,
        required: true,
        default: 0
    },
    UpdateTime:{
        type: Date,
        default: Date.now
    },
    ExpiredTime:{
        type: Date,
        default: Date.now
    },
});

const MsgSchema = new mongoose.Schema({
    UID: {
        type: Number,
        required: true,
    },
    SenderUID: {
        type: Number,
        required: true,
        default: 0
    },
    OwnerUID: {
        type: Number,
        required: true,
        default: 0
    },
    Title:{
        type: String,
        default: ""
    },
    Content: {
        type: String,
        default: ""
    },
    Status:{
        type: Number,
        default: 0
    },
    CreateTime:{
        type: Date,
        default: Date.now
    },
    ExpiredTime:{
        type: Date,
        default: Date.now
    },
});

const ChoiceSchema = new mongoose.Schema({
    UID: {
        type: Number,
        required: true,
    },
    OwnerUID: {
        type: Number,
        required: true,
        default: 0
    },
    ChoiceID:{
        type: Number,
        required: true,
        default: 0
    },
    CreateTime:{
        type: Date,
        default: Date.now
    },
});

const PostSchema = new mongoose.Schema({
    UID:{
        type: Number,
        required: true,
    },
    OwnerUID: {
        type: Number,
        required: true,
        default: 0
    },
    Title:{
        type: String,
        required: true,
    },
    ContractStatus:{
        type: Array,
        required: true
    },
    Gender:{
        type: String,
        required: true
    },
    Experience:{
        type: String,
        required: true
    },
    Skills:{
        type: Array,
        required:true
    },
    Holiday:{
        type: Number,
        required:true
    },
    Location:{
        type: Number,
        required:true
    },
    Address:{
        type: Array,
        required: true
    },
    Salary:{
        type: Number,
        required:true
    },
    UnitSize:{
        type: Number,
        required:true
    },
    OtherMaid:{
        type: Boolean,
        required:true
    },
    Overseas:{
        type: Boolean,
        required: true
    },
    ShareBed:{
        type: Boolean,
        required: true
    },
    Accommodation:{
        type: Boolean,
        required:true
    },
    Language:{
        type: Number,
        required:true
    },
    FirstDay:{
        type: Number,
        required:true
    },
    Deadline:{
        type: Number,
        required:true
    },
    Description:{
        type: String,
        required:true
    },
    CreateTime:{
        type: Number,
        default: Date.now
    },
    ExpiredTime:{
        type: Number,
        default: Date.now
    },
    Status:{
        type: Number,
        default: 0
    },
    FavoritedBy:{
        type: Array,
        default: []
    },
    AppliedBy:{
        type: Array,
        default: []
    },
    AppliedTime:{
        type: Number,
        default: Date.now
    }
})
module.exports = {
    AccountSchema, ClientDeviceSchema, PostSchema, ProfileSchema, StackTokenSchema, MsgSchema, ChoiceSchema
}

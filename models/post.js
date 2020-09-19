const mongoose = require('mongoose');
const Comments = require('./comment');
const User = require('./user');

const Schema = mongoose.Schema;

var postSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        minlength: 30
    },
    abstract: {
        type: String,
        maxlength: 200
    },
    // keywords: {
    //     type: [String],
    //     required: true
    // },
    image: {
        type: String
    },
    posted_by: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    post_body:{
        type: String,
    },
    comments: [ { type: Schema.Types.ObjectId, ref: 'Comment' } ]
},{
    timestamps: true
});

var Posts = mongoose.model('Post', postSchema);

module.exports = Posts;
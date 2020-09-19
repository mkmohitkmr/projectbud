const mongoose = require('mongoose');
// const Post = require('./post');
const Schema = mongoose.Schema;
const Users = require('./user');

var commentSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    by_user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    on_post:{
        type: Schema.Types.ObjectId,
        required:true
    }
},{
    timestamps: true
});


 var Comments = mongoose.model('Comment', commentSchema);
// module.exports = commentSchema;
module.exports = Comments;
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const multer = require('multer');
const cors = require('./cors');
const fs = require('fs');

//setup multer for image file upload

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const imageFileFilter = (req,file,cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){
        var err = new Error('You are allowed to upload only image file!');
        return cb(err, false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter});



const Posts = require('../models/post');
const Comments = require('../models/comment');


const postRouter = express.Router();

postRouter.use(bodyParser.json());

var exist = function(list, f){
    for(var item of list){
        if(item._id == f)
            return true;
    }
    return false;
}




postRouter.route('/:postId/view')
.options(cors.corsWithOptions, (req, res)=>{ res.statusCode = 200; })
.get(cors.cors, (req, res, next) => {

    Posts.findById(req.params.postId)
    .populate({
        path: 'comments',
        populate: {path: 'by_user', model: 'User', select: '_id firstname lastname username'}
    })
    .populate('posted_by', '_id username')
    .then((post) => {
        if(post!=null){
            res.statusCode = 200;
            res.setHeader('Content-Type','text/html');
            // res.setHeader('Content-Type','application/json');
            console.log('Post with id: '+post._id+' found!');
            console.log(post);
            async function getuser(req){
                var User = await authenticate.loggedIn(req);
                console.log('View post user: ',User);
                res.render('viewPost', {
                    post: post,
                    user: User
                });
            }
            getuser(req);
        // res.json(post);
        } else {
            
            var err = new Error('Post '+req.params.postId+' not found!');
            err.statusCode = 404;
            next(err); 
        }
    },(err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type','text/html');
    
    var err = new Error('PUT operation is not allowed at /'+req.params.postId+'/view');
    res.render('error', {err: err});
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type','text/html');
    
    var err = new Error('POST operation is not allowed at /'+req.params.postId+'/view');
    // res.render('error', {err: err});
    next(err);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req,res,next) => {
    try {
        const post = await Posts.findById(req.params.postId).populate('comments');
        console.log('Post with id: ' + req.params.postId + ' found!');
        console.log(`Post is: ${post}`);


        if (String(req.user._id) !== String(post.posted_by)) {
          var err = new Error('You are not allowed to delete someone else\'s post!');
          err.status = 403;
          throw err;
        }
    
        const removePromise = (filepath) => {
          return new Promise((resolve, reject) => {
            try {
              fs.unlink(filepath, (err) => {
                  if (err) throw err;
                  console.log('file was deleted');
                  resolve()
              });
            } catch (err) {
              reject(err)
            }
          })
        }
  
        if (post.image) await removePromise('./public/uploads/images/' + post.image);
        await Comments.deleteMany({on_post: post._id});

        await post.remove();
    
        console.log('Post with id: ' + req.params.postId + ' removed!');
        res.redirect('/');
      } catch (err) {
        next(err)
      }
});


postRouter.route('/:postId/edit')
.options(cors.corsWithOptions, (req, res)=>{ res.statusCode = 200; })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Posts.findById(req.params.postId)
    .then((post) => {
        if(post != null){
            res.statusCode = 200;
            console.log('Post found');
            res.setHeader('Content-Type','text/html');
            // var User = loggedIn(req);
            res.render('editPost', {post: post, user: req.user});
        } else{
            var err = new Error('Post '+req.params.postId+' not found!');
            err.statusCode = 404;
            next(err);
        }
    },(err)=>next(err))
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/html')
    res.end('POST operation is not supported at /post/'+req.params.postId+'/edit');
})
.put(cors.corsWithOptions, authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    if(req.file)
    {
        req.body.image = req.file.filename;
    }

    Posts.findByIdAndUpdate(req.params.postId, { $set: req.body }, {new: true})
    .then((post) => {
        console.log('The post has been edited successfully');
        res.statusCode = 200;
        res.setHeader('Content-Type','text/html');
        // alert('Post has been updated successfully!');
        res.redirect('/post/'+post._id+'/view');
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next)=>{
    try {
        const post = await Posts.findById(req.params.postId)
        console.log('Post with id: ' + req.params.postId + ' found!');
    
        if (String(req.user._id) !== String(post.posted_by)) {
          var err = new Error('You are not allowed to delete someone else\'s post!');
          err.status = 403;
          throw err;
        }
    
        const removeAsyncPromise = (filepath) => {
          return new Promise((resolve, reject) => {
            try {
              fs.unlink(filepath, (err) => {
                  if (err) throw err;
                  console.log('file was deleted');
                  resolve()
              });
            } catch (err) {
              reject(err)
            }
          })
        }
    
        if (post.image) await removeAsyncPromise('./public/uploads/images/' + post.image)
        await Comments.deleteMany({on_post: post._id});
        await post.remove()
    
        console.log('Post with id: ' + req.params.postId + ' removed!');
        res.redirect('/');
      } catch (err) {
        next(err)
      }
});

postRouter.route('/:postId/comment/')
.options(cors.corsWithOptions, (req, res)=>{ res.statusCode = 200; })
.get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/html')
    res.end('GET operation is not supported at /post/'+req.params.postId+'/comment/');
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Posts.findById(req.params.postId)
    .then((post) => {
        
        if(post!=null){
            console.log('Found post');
            console.log(req.body);
            var comment = new Comments(req.body);
            comment.on_post = req.params.postId;
            comment.by_user = req.user._id;
            console.log(comment);

            comment.save()
            .then((comment) => {
                console.log('Comment saved in the database :)');
                post.comments.unshift(comment);
                return post.save();
            })
            .then(() => {
                res.redirect('/post/'+req.params.postId+'/view');
            }, (err) => next(err))
            .catch((err) => next(err));
    }else{
        var err = new Error('Post '+req.params.postId+' not found!');
        err.statusCode = 404;
        next(err);
    }
},(err) => next(err))
.catch(err=>next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type','text/html');
    res.end('PUT operation is not supported at /post/'+req.params.postId+'/comment');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.setHeader('Content-Type','text/html');
    res.end('DELETE operation is not supported at /post/'+req.params.postId+'/comment');
});


postRouter.route('/:postId/comment/:commentId')
.options(cors.corsWithOptions, (req, res)=>{ res.statusCode = 200; })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    
    Posts.findById(req.params.postId)
    .populate({
        path: 'comments',
        populate: {path: 'by_user', model: 'User', select: '_id firstname lastname username'}
    })
    .populate('posted_by', '_id username')
    .then(async (post) => { 
        console.log(post);
        if (post != null && exist(post.comments, req.params.commentId) != false) {
            var comment = await Comments.findById(req.params.commentId);
            if(String(comment.by_user) === String(req.user._id)){
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.render('editComment',{
                    post: post,
                    commentId: req.params.commentId,
                    user: req.user
                });
            }
            else{
                err = new Error('You are not allowed to edit someone else\'s comment');
                err.status = 403;
                return next(err);
            }
        }
        else if (post == null) {
            err = new Error('Post ' + req.params.postId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/html')
    res.end('POST operation is not supported at /post/'+req.params.postId+'/'+req.params.commentId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    // console.log('You have called put at comment with: ',req.body.comment);
    Comments.findById(req.params.commentId)
    .then((comment) => {
        if(comment !== null){
            console.log(comment);

            if(String(comment.on_post) === String(req.params.postId)){
                if(String(comment.by_user) === String(req.user._id)){
                    comment.comment = req.body.comment;
                    comment.save((comment) => {
                        res.status = 200;
                        res.setHeader('Content-Type','text/html');
                        res.redirect('/post/'+req.params.postId+'/view');
                    },(err)=>next(err));
                }
                else{
                    var err = new Error('You are not allowed to edit someone else\'s comment');
                    err.statusCode = 404;
                    next(err);
                }
            }
            else{
                var err = new Error('Comment and post do not match!');
                err.statusCode = 404;
                next(err);
            }
        }
        else{
            var err = new Error('Comment not found!');
            err.statusCode = 404;
            next(err);
        }

    }, (err)=>next(err))
    .catch((err)=>next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next)=>{
    try {
        const comment = await Comments.findById(req.params.commentId)
        if(comment)
            console.log('Comment with id: ' + req.params.commentId + ' found!');
        console.log(comment);
    
        if (String(req.user._id) !== String(comment.by_user)) {
          var err = new Error('You are not allowed to delete someone else\'s comment!');
          err.status = 403;
          throw err;
        }

        if(String(req.params.postId) !== String(comment.on_post)){
            var err = new Error('Unrelated post and comment!');
            err.status = 403;
            throw err;
        }
    
        await comment.remove()
    
        console.log('comment with id: ' + req.params.commentId + ' removed!');
        res.redirect('/post/'+req.params.postId+'/view');
      } catch (err) {
        next(err)
      }
});


postRouter.route('/add')
.options(cors.corsWithOptions, (req, res)=>{ res.statusCode = 200; })
.get(cors.cors, (req, res, next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    async function getuser(req){
        var User = await authenticate.loggedIn(req);
        console.log(User);
        res.render('addPost', {user: User});
    }
    getuser(req);
})
.post(cors.corsWithOptions, authenticate.verifyUser, upload.single('image'), (req, res, next) => {
    console.log('Post added by: ',req.user.username);
    req.body.posted_by = req.user._id;
    if(req.file)
        req.body.image = req.file.filename;
    // console.log('req.file', req.file);
    Posts.create(req.body)
    .then((post) => {
        console.log('Post created', post);
        res.statusCode = 200;
        res.setHeader('Content-Type','text/html');
        // res.end('Posted');
        res.redirect('/post/'+post._id+'/view');
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/html')
    res.end('PUT operation is not supported at /post/add');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next)=>{
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/html')
    res.end('DELETE operation is not supported at /post/add');
});


module.exports = postRouter;
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authenticate = require('../authenticate')
var cors = require('./cors');

var Users = require('../models/user');
var Posts = require('../models/post')

var usersRouter = express.Router();
usersRouter.use(bodyParser.json());

/* GET users listing. */
usersRouter.route('/register')
.options( cors.corsWithOptions, (req, res) => { res.statsCode = 200; })
.get(cors.cors, (req,res,next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type','text/html');
  res.render('register', {user: false});
})
.post(cors.corsWithOptions, (req,res,next) => {
  Users.register(new Users({username: req.body.username}), req.body.password, (err, user) => {
    if(err){
      // res.statusCode = 500;
      // res.setHeader('Content-Type', 'application/json');
      // res.json({err: err});
      return next(err);
    }
    else{
      if(req.body.firstname)
        user.firstname = req.body.firstname;
      if(req.body.lastname)
        user.lastname = req.body.lastname;

      user.save((err, user) => {
        if(err){
          return next(err);
        }
        passport.authenticate('local')(req,res,() => {
          res.statusCode = 200;
          res.setHeader('Content-type','text/html');
          console.log('Registration successful', user);
          res.render('regSuccess', { user: false });
        });
      })
    }
  });
})
.put(cors.corsWithOptions, (req,res,next)=>{
  res.statusCode = 200;
  res.setHeader('Content-Type','text/plain');
  res.end('PUT operation is not supported at /users/register');
})
.delete(cors.corsWithOptions, (req,res,next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type','text/plain');
  res.end('delete operation is not supported');
});

usersRouter.route('/login')
.options( cors.corsWithOptions, (req, res) => { res.statsCode = 200; })
.get(cors.corsWithOptions, (req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type','text/html');
  res.render('login', {user: false});
})
.post(cors.corsWithOptions, passport.authenticate('local', { failureRedirect: '/users/login' }), (req,res) => {
  console.log('Generating token for: ', req.user);
  var token = authenticate.getToken({_id: req.user._id});

  // res.statusCode = 200;
  // res.json({success: true, token: token, status: "login successful!"});
  res.cookie('jwt', token, {signed: true});
  //window.localStorage.setItem(token, token);
  res.redirect('/');
  
})
.put(cors.corsWithOptions, (req,res,next)=>{
  res.statusCode = 200;
  res.setHeader('Content-Type','text/plain');
  res.end('PUT operation is not supported at /users/login');
})
.delete(cors.corsWithOptions, (req,res,next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type','text/plain');
  res.end('delete operation is not supported');
});

usersRouter.route('/logout')
.get(cors.cors, (req,res,next) => {
  console.log(req.signedCookies.jwt);
  if(req.signedCookies.jwt){
    res.clearCookie('jwt');
    res.redirect('/');
  }
  else{
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err); 
  }
});

usersRouter.route('/:username/dashboard')
.options( cors.corsWithOptions, (req, res) => { res.statsCode = 200; })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
  var user = req.user;
  Posts.find({posted_by: user._id})
  .populate('posted_by', 'username _id createdAt')
  .then((posts) => {
      res.statusCode = 200;
      res.setHeader('Content-Type','text/html');
      res.render('dashmain', {
        user: user,
        posts: posts 
      });
  },(err) => next(err))
  .catch((err) => next(err));
});



module.exports = usersRouter;

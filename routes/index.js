var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var mongoose = require('mongoose');
var authenticate = require('../authenticate');
var cors = require('./cors');

var Posts = require('../models/post');

router.use(bodyParser.json());


/* GET home page. */
router.route('/')
.options(cors.corsWithOptions, (req, res)=>{ res.statusCode = 200; })
.get(cors.cors, (req, res, next) => {
  Posts.find({})
  .populate('posted_by', 'username _id')
  .then((allPosts) => {
    return allPosts;
  })
  .then((list) => {
    console.log("list: ",list);
    if(list.length > 10)
      list = list.splice(10, list.length-10);
    
    res.statusCode = 200;
    res.setHeader('Content-Type','text/html');
    async function getuser(req){
      var User = await authenticate.loggedIn(req);
      console.log('Index router: ',User);
      res.render('index', {
      posts: list,
      user: User
    });
    }
    getuser(req);
    
  })
  .catch((err) => next(err));
});

module.exports = router;

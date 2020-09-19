var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressLayouts = require('express-ejs-layouts');
var methodOverride = require('method-override');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require('passport');
var authenticate = require('./authenticate');
var config = require('./config');
var connectFlash = require('connect-flash')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// var addRouter = require('./routes/addRouter');
var postRouter = require('./routes/postRouter');

const mongoose = require('mongoose');

var Users = require('./models/user');
var Posts = require('./models/post');
var Comments = require('./models/comment');

const url = config.mongoUrl;

const connect = mongoose.connect(url); 

connect.then( (err) => {
  console.log('Connected correctly to the database!')
},(err) => {console.log(err)});



var app = express();

app.all('*', (req, res, next) => {
  if(req.secure){
    return next();
  }
  else{
    res.redirect(307, 'https://'+req.hostname+':'+app.get('secPort')+req.url);
  }
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressLayouts);
app.use(methodOverride('_method'));
app.use(cookieParser(config.cookiekey));

// app.use(cookieParser(config.flashKey));
app.use(session({
  cookie: {
  name: 'flashmsg',
  maxAge: 5000,
  },
  saveUninitialized: false,
  resave: false,
  secret: config.flashKey
}));
app.use(connectFlash());



app.use(passport.initialize());


app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/post', postRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);
  var User = authenticate.loggedIn(req);
  res.render('error', { err: err , user: User});
});

module.exports = app;

var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
// var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var FacebookTokenStrategy = require('passport-facebook-token');

var config = require('./config');


exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user){
    return jwt.sign(user, config.secretKey, {
        expiresIn: 3600
    });
};


var extractFromCookie = function (req)
{   
    var token = null;
    if(req && req.signedCookies)
        token = req.signedCookies.jwt;
    return token;
}

var opts = {};
opts.jwtFromRequest = extractFromCookie;
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    // console.log("Jwt Payload: ", jwt_payload);
    // console.log(jwt_payload._id);
    User.findOne({_id: mongoose.Types.ObjectId(jwt_payload._id)}, (err,user) => {
        if(err){
            return done(err,false);
        }
        else if(user){
            // console.log('Found user is: ', user);
            return done(null, user);
        }
        else
            return done(null,false);
    });
}));

var verifyToken = async function verifyToken(token, secretkey){ 
    // console.log('This is token: ', token);
    // console.log('This is secretkey: ', secretkey);
    try{
    var data = jwt.verify(token, secretkey);
    return data;
    } catch(err){
        return err;
    }
    
}

exports.loggedIn = async function loggedIn(req){
    try{
        var token = req.signedCookies.jwt;
        // console.log(token);
        var userFound = false;
        if(token){
            data = await verifyToken(token, config.secretKey);
            userFound = await getUser(data);

            // console.log('Data: ',data);
            // console.log('User: ', userFound);
        }
        return userFound;
    }
    catch(error){
        console.log(error);
    }
}

var getUser = async function getUser(jwt_payload){
    try{
    var query = User.findOne({_id: jwt_payload._id});
    var returnUser = await query.exec();
    return returnUser;
    }
    catch(err){
        console.log(err);
    }
}


exports.verifyUser = passport.authenticate('jwt', {session:false, failureRedirect: '/users/login'});

exports.facebookPassport = passport.use(new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackUrl 
}, (accessToken, refreshToken, profile, done) =>{
    User.findOne({facebookId: profile.id}, (err, user) => {
        if(err){
            return done(err, false);
        }

        if(!err && user !== null) {
            return done(null, user);
        }
        else{
            user = new User({
                username: profile.displayName
            });
            user.facebookId = profile.id;
            user.firstname = profile.name.givenName;
            user.lastname = profile.name.familyName;
            user.save((err, user) => {
                if(err)
                    return done(err, false);
                else
                    return done(null, user);
            })
        }
    })
}));
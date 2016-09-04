var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var oauthSignature = require('oauth-signature');
var request = require('request');
var querystring = require('querystring');
var _ = require('lodash');
var bodyParser = require('body-parser');
var n = require('nonce')();

var port = process.env.PORT || 8080;

var app = express();

app.set('views', process.cwd() + '/views' );
app.set('view engine', 'jade');

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/build', express.static(process.cwd() + '/build'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({
	secret: 'topsecret',
    resave:'false',
    saveUninitialized: 'false'
}));
app.use(passport.initialize());
app.use(passport.session());

var Account = require('./models/account.js');
var AttendedBar = require('./models/barsAttended.js');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());



var dbURL = process.env.MONGOLAB_URI || 'mongodb://localhost/MyDataBase';

mongoose.connect(dbURL);

app.get('/', function(req,res) {
	if (req.user) {
		if (req.query.auth = "true") {
			if (req.session.bars) {
				res.render('index', { user: req.user.username, bars: req.session.bars } );
			}
			else {
				res.render('index', { user: req.user.username, bars: "none" } );
			}
		}
		else {
			res.render('index', { user: req.user.username, bars: "none" } );
		}
	}
	else {
		res.render('index', { user: "", bars: "none" } );
	}
	
});

app.post('/', function(req,res) {
	var date = Math.floor(Date.now()/1000);
	var httpRequest = 'GET';
	
	var yelpUrl = 'http://api.yelp.com/v2/search';

	var apiParams = { 
		limit: 7,
		location: req.body.location,
		oauth_consumer_key:"Ub3Bz1y8Vh5bMUo1KQ8UiQ",
		oauth_nonce:n(), //random unique string
		oauth_signature_method:"HMAC-SHA1",
		oauth_timestamp:n().toString().substr(0,10), //time since request unix epoch
		oauth_token:"TD96MloObgBRqUBUbsn5biwwWznaiA7m",
		oauth_version : '1.0',
		term: 'Bars'
		
	};
	
	var consumerSecret = process.env.CONSUMER_SECRET || 'xvvNvYGRR-5L87xfCj7HPwSsKpI';
	var tokenSecret = process.env.TOKEN_SECRET || 'qzmYnEymMxLAJjImYLiZ2i6yDd0';

	var sig = oauthSignature.generate(httpRequest, yelpUrl, apiParams, consumerSecret, tokenSecret, { encodeSignature: false} ); //get the signature
	
	apiParams.oauth_signature = sig;
	
	var apiCall = yelpUrl + "?" + querystring.stringify(apiParams);
	
	request(apiCall, function(err, response, body) {
		if (err) {
			console.log(err);
		}
		else {
			if (req.user) {
				req.session.bars = body; //session will store search
				res.render('index', { user:req.user.username, bars: body });
			}
			else {
				req.session.bars = body; 
				res.render('index', { user:"", bars: body });
			}
		}
		
	});
	
});

app.get('/getAttendees', function(req,res) { //api for getting attended bars
	var arr = req.query; 
	var ids = req.query.idArr.slice();
	
	AttendedBar.find({bar_id: { $in: ids }}, function(err, docs) {
		var day = new Date();
		var docHolder = [];
		docs.forEach(function(doc) {
			if (day.getDay()!=doc.date.getDay()) { //need to clear attended bars on new days
				doc.remove(); 
			}
			else {
				if (day.getMonth()==doc.date.getMonth()) { 
					docHolder.push(doc);
				}
				else {
					doc.remove();
				}
			}
		});
		if (docHolder.length==0) {
			var obj = { "payload":"none" };
			res.end(JSON.stringify(obj));
		}
		else {
			if (req.user) {
				res.end(JSON.stringify({"payload": docs, "user": req.user.username }));
			}
			else {
				res.end(JSON.stringify({"payload": docs, "user": "none" }));
			}
		}
	});
	
});

app.get('/attendingBar', function(req,res) { //handle changing bar counters
	var id = req.query.theID;
	if (!req.user) {
		res.end(JSON.stringify({"payload":"login"})); //if user not logged, need to login first
	}
	else {
		AttendedBar.findOne({bar_id: id}, function(err, doc) {
			var day = new Date();
			if (doc==null) { //bar is not attended yet
				var arr = [];
				arr.push(req.user.username);
				var newBar = new AttendedBar({ bar_id: id, attendees: arr.slice(), count: 1, date: day });
				newBar.save();
				res.end(JSON.stringify({"payload":"success", "user": req.user.username }));
			}
			else { //bar is already attended
				if (doc.attendees.indexOf(req.user.username)>-1) { //user already attending
					var index = doc.attendees.indexOf(req.user.username);
					doc.attendees.splice(index,1);
					doc.count = doc.count - 1;
					doc.save();
					res.end(JSON.stringify({"payload":"unattended"}));
				}
				else { //user not attending yet 
					doc.attendees.push(req.user.username);
					doc.count = doc.count + 1;
					doc.date = day; 
					doc.save();
					res.end(JSON.stringify({"payload":"success"}));
				}
			}
		});
	}
		
});

app.get('/login', function(req,res) {
	if (req.query.failed) {
		res.render('login', { user:"", failed:true });
	}
	else {
		res.render('login', { user:"" });
	}
	
});

app.post('/login', passport.authenticate('local',{
	successRedirect: '/?auth=true',
	failureRedirect: '/login?failed=true'
	
}));

app.get('/logout', function(req,res) {
	req.logout();
	res.redirect('/');
});

app.get('/register', function(req,res) {
	if (req.user) {
		res.render('register', { user:req.user.username });
	}
	else {
		res.render('register', { user:"" });
	}
});

app.post('/register', function(req,res) {
	Account.register(new Account({username:req.body.username}), req.body.password, function(err, account) {
		if (err) {
			console.log(err);
			res.render('register', { user:"", taken:true });
		}
		else {
			req.login(account, function(err) {
				res.redirect('/');
			});
		}
	});
});

app.get('/contact', function(req,res) {
	res.end("Page under construction.");
});

app.listen(port);
























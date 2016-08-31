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


app.get('/', function(req,res) {
	res.render('index');
	
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
			console.log(response);
		}
		
	});
	
});


app.listen(port);
























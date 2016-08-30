var express = require('express');

var port = process.env.port || 8080;

var app = express();

app.set('views', process.cwd() + '/views' );
app.set('view engine', 'jade');

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/build', express.static(process.cwd() + '/build'));

app.get('/', function(req,res) {
	res.render('index');
	
});

app.listen(port);
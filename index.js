var express = require('express');
var ehb = require('express-handlebars');

var cas = require('./routes/cas');

var app = express();

hbs = ehb.create({
    defaultLayout: 'main',
    extname: '.hbs'
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use('/static', express.static('public'));

app.get('/user', function(req, res) {
    res.send(req.session ? req.session.username :'');;
});

// Everything after this line will require authentication
app.use('/*', cas);

app.get('/', function(req, res) {
    res.render('home');
});

app.listen(3000, function() {
    console.log("listening on port 3000");
});

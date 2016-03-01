var express = require('express');
var ehb = require('express-handlebars');
var bodyParser = require('body-parser');
var path = require('path');

var cas = require('./routes/cas');

var init_db = require('./routes/init_db');
var select_db = require('./routes/select_db');

var get_user = require('./routes/get_user');
var get_schedules = require('./routes/get_schedules');
var get_semester = require('./routes/get_semester');
var get_semesters = require('./routes/get_semesters');
var get_classes = require('./routes/get_classes');
var get_sections = require('./routes/get_sections');
var get_timeslots = require('./routes/get_timeslots');

var create_user = require('./routes/create_user');
var create_schedule = require('./routes/create_schedule');

var update_schedule = require('./routes/update_schedule');

var delete_user = require('./routes/delete_user');
var delete_schedule = require('./routes/delete_schedule');

var app = express();

hbs = ehb.create({
    defaultLayout: 'main',
    extname: '.hbs'
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use('/static', express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/user', function(req, res) {
    res.send(req.session ? req.session.username : '');
});

// Everything after this line will require authentication
//app.use('/*', cas);

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/index.html')); 
});

// Used for sending back partial html files, which are sandwiched between the
// index.html template 
app.get('/partials/:partial_name', function(req, res) {
    res.sendFile(path.join(__dirname, '/partials/', req.params.partial_name)); 
});

// Init database
app.use('/init', init_db);

// Test database
app.use('/select', select_db);

// Get user by specified username
app.get('/user/:username', function(req, res, next) {
    req.username = req.params.username;
    get_user(req, res, next);
});

// Get all schedules by specified user id
app.get('/schedules/:user_id', function(req, res, next) {
    req.user_id = req.params.user_id;
    get_schedules(req, res, next);
});

// Get semester by specified semester id
app.get('/semester/:semester_id', function(req, res, next) {
    req.semester_id = req.params.semester_id;
    get_semester(req, res, next);
});

// Get all semesters
app.get('/semesters', get_semesters);

// Get all classes by specified semester id
app.get('/classes/:semester_id', function(req, res, next) {
    req.semester_id = req.params.semester_id;
    get_classes(req, res, next);
});

// Get all sections by specified class id
app.get('/sections/:class_id', function(req, res, next) {
    req.class_id = req.params.class_id;
    get_sections(req, res, next);
});

// Get all timeslots by specified section id
app.get('/timeslots/:section_id', function(req, res, next) {
    req.section_id = req.params.section_id;
    get_timeslots(req, res, next);
});

// Create user
app.post('/user', create_user);

// Create schedule
app.post('/schedule', create_schedule);

// Add or remove a schedule/timeslot to or from a specified schedule
app.put('/schedule/:schedule_id', function(req, res, next) { 
    req.schedule_id = req.params.schedule_id;
    update_schedule(req, res, next);
});

// Delete specified user
app.delete('/user/:user_id', function(req, res, next) {
    req.user_id = req.params.user_id;
    delete_user(req, res, next);
});

// Delete specified schedule
app.delete('/schedule/:schedule_id', function(req, res, next) {
    req.schedule_id = req.params.schedule_id;
    delete_schedule(req, res, next);
});

app.listen(3000, function() {
    console.log("listening on port 3000");
});

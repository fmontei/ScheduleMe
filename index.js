var express = require('express');
var ehb = require('express-handlebars');
var bodyParser = require('body-parser');

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
    res.render('home');
});

app.get('/courseoff', function(req, res) {
    res.render('courseoff');
});

// Init database
app.use('/init', init_db);

// Test database
app.use('/select', select_db);

// Get user by ID
app.use('/user/:username', function(req, res, next) {
    req.username = req.params.username;
    get_user(req, res, next);
});

// Get all schedules by user id
app.use('/schedules/:user_id', function(req, res, next) {
    req.user_id = req.params.user_id;
    get_schedules(req, res, next);
});

// Get semester by specific semester id
app.use('/semester/:semester_id', function(req, res, next) {
    req.semester_id = req.params.semester_id;
    get_semester(req, res, next);
});

// Get all semesters
app.use('/semesters', get_semesters);

// Get all classes by semester id
app.use('/classes/:semester_id', function(req, res, next) {
    req.semester_id = req.params.semester_id;
    get_classes(req, res, next);
});

// Get all sections by class id
app.use('/sections/:class_id', function(req, res, next) {
    req.class_id = req.params.class_id;
    get_sections(req, res, next);
});

// Get all timeslots by section id
app.use('/timeslot/:section_id', function(req, res, next) {
    req.section_id = req.params.section_id;
    get_timeslots(req, res, next);
});

// Create user
app.use('/user', create_user);

// Create schedule
app.use('/schedule', create_schedule);

// Add or delete section/timeslot to schedule
app.use('/update_schedule', update_schedule);

// Delete user
app.use('/delete_user', delete_user);

// Delete schedule
app.use('/delete_schedule', delete_schedule);

app.listen(3000, function() {
    console.log("listening on port 3000");
});

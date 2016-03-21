var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

var add_section_to_schedule = require('../scripts/add_section_to_schedule');

router.use(function(req, res, next) {
    var section_ids = req.body.sectionIDs,
        user_id = req.body.userID,
        semester_id = req.body.semesterID,
        errors = [];

    async.waterfall([
        function(callback) {
            db.all('select count(*) as count from schedule where user_id = $user_id;', {
                $user_id: user_id
            }, function(err, rows) {
                callback(err, rows[0]['count']);
            });
        },
        function(count, callback) {
            var haveSchedule = count > 0;
            if (haveSchedule === true) {
                callback('Only one schedule per user currently supported.', null);
                return;
            }
            db.run('insert into schedule(user_id, semester_id) values($user_id, $semester_id);', {
                $user_id: user_id,
                $semester_id: semester_id
            }, function(err) {
                callback(err, this.lastID);
            });
        },
        function(schedule_id, callback) {
            for (var i = 0; i < section_ids.length; i++) {
                add_section_to_schedule.execute(section_ids[i], schedule_id).
                    then(function(result) {
                    if (result[0] === 500) {
                        errors.push(errors[1]);
                    }
                });
            }
            callback(null);
        }
    ], function(err) {
        if (err) {
            return res.status(500).send(err);
        } else if (errors.length > 0) {
            return res.status(500).send(errors);
        } else {
            return res.status(200).send('Successfully saved schedule.');
        }
    });
});

module.exports = router;



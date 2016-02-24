var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Get schedules by user id.
 */
router.use(function(req, res, next) {
    var user_id = req.user_id;
    
    if (!user_id) {
        res.status(404).send(null);
        return;
    }

    async.waterfall([
        function(callback) {
            user_id = user_id.trim();
            var query = "select * from sectionschedule ss " +
                "left outer join schedule sch on ss.schedule_id = sch.schedule_id " +
                "inner join section sect on sect.section_id = ss.section_id " +
                "left outer join class cls on cls.class_id = sect.class_id " +
                "inner join timeslot ts on ts.timeslot_id = ss.timeslot_id " + 
                "where sch.user_id = '" + user_id + "';";
            console.log(query);
            db.all(query, function(err, rows) {
                callback(null, rows);
            });
        }
    ], function (err, rows) {
        if (rows && rows.length > 0) {
            res.send(rows);
        } else {
            res.status(404).send('User with user_id: ' + user_id + ' not found.');
        }
    });
});

module.exports = router;

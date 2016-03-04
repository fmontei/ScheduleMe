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
    var semester_id = req.semester_id;
    
    if (!user_id || !semester_id) {
        return res.status(400).send('Malformed URL.');
    }

    async.waterfall([
        function(callback) {
            user_id = user_id.trim();
            var query = "select * from schedule sch " +
                "inner join sectionschedule ss on ss.schedule_id = sch.schedule_id " +
                "inner join section sect on sect.section_id = ss.section_id " +
                "left outer join class cls on cls.class_id = sect.class_id " +
                "inner join timeslot ts on ts.timeslot_id = ss.timeslot_id " + 
                "where sch.user_id = '" + user_id + "' and sch.semester_id = '" +
                semester_id + "' order by ss.schedule_id asc;";
            console.log(query);
            db.all(query, function(err, rows) {
                callback(null, rows);
            });
        }
    ], function (err, rows) {
        if (rows && rows.length > 0) {
            res.send(rows, 200);
        } else {
            res.status(404).send('Query failed.');
        }
    });
});

module.exports = router;

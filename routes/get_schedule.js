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
            var query = "select ss.schedule_id, ss.section_id, ss.timeslot_id, " +
                "cls.class_name, cls.department, cls.class_number, cls.credits, " +
                "sect.crn, sect.section_name, sect.professor, sect.seat_capacity, " +
                "sect.seat_actual, sect.seat_remaining, ts.location, ts.start_time, " +
                "ts.end_time, ts.day_of_week from schedule sch " +
                "inner join sectionschedule ss on ss.schedule_id = sch.schedule_id " +
                "inner join section sect on sect.section_id = ss.section_id " +
                "left outer join class cls on cls.class_id = sect.class_id " +
                "inner join timeslot ts on ts.timeslot_id = ss.timeslot_id " +
                "where sch.user_id = '" + user_id + "' and sch.semester_id = '" +
                semester_id + "' order by ss.schedule_id, ss.section_id, ss.timeslot_id asc;";
            db.all(query, function(err, rows) {
                console.log(JSON.stringify(rows));
                var formattedRows = [];
                for (var i = 0; rows && i < rows.length; i++) {
                    var sectionID = rows[i]['section_id'];
                    var previouslySeenRow = getRowBySectionID(formattedRows,
                        sectionID);
                    if (previouslySeenRow === null) {
                        var dayOfWeek = rows[i]['day_of_week'];
                        delete rows[i]['day_of_week'];
                        rows[i]['days_of_week'] = [];
                        rows[i]['days_of_week'].push(dayOfWeek);
                        formattedRows.push(rows[i]);
                    } else {
                        var dayOfWeek = rows[i]['day_of_week'];
                        previouslySeenRow['days_of_week'].push(dayOfWeek);
                    }
                }
                function getRowBySectionID(formattedRows, sectionID) {
                    for (var i = 0; i < formattedRows.length; i++) {
                        if (formattedRows[i]['section_id'] === sectionID) {
                            return formattedRows[i];
                        }
                    }
                    return null;
                }
                callback(null, formattedRows);
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

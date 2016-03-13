var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var url = require('url');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Get schedules by user id.
 */
router.use(function(req, res, next) {
    var user_id = req.user_id.trim();
    var semester_id = req.semester_id.trim();

    var urlParts = url.parse(req.url, true);
    var queryString = urlParts.query;
    var groupByArg = queryString.group_by;

    async.waterfall([
        function(callback) {
            var query = "select * from schedule sch " +
                "inner join sectionschedule ss on ss.schedule_id = sch.schedule_id " +
                "inner join section sect on sect.section_id = ss.section_id " +
                "left outer join class cls on cls.class_id = sect.class_id " +
                "inner join timeslot ts on ts.timeslot_id = ss.timeslot_id " +
                "where sch.user_id = '" + user_id + "' and sch.semester_id = '" +
                semester_id + "' order by ss.schedule_id, ss.section_id, ss.timeslot_id asc;";
            db.all(query, function(err, rows) {
                if (!queryString || !groupByArg) {
                    callback(null, rows);
                } else {
                    var formattedRows = [];
                    for (var i = 0; rows && i < rows.length; i++) {
                        var val = rows[i][groupByArg];
                        var previouslySeenRow = getRowByGroupByArg(formattedRows, val);
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
                    function getRowByGroupByArg(formattedRows, val) {
                        for (var i = 0; i < formattedRows.length; i++) {
                            if (formattedRows[i][groupByArg] === val) {
                                return formattedRows[i];
                            }
                        }
                        return null;
                    }
                    callback(null, formattedRows);
                }
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

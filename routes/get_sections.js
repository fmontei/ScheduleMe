var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Get all sections by class id.
 */
router.use(function(req, res, next) {
    var class_id = req.class_id;

    if (!class_id) {
        return res.status(400).send('url request must end with /:class_id.');
    }

    async.waterfall([
        function(callback) {
            class_id = class_id.trim();
            var query = "SELECT * from section sect inner join timeslot ts on " +
                "(sect.section_id = ts.section_id) WHERE sect.class_id = '" + class_id + "';";
            db.all(query, function(err, rows) {
                var formattedSections = [];
                for (var i = 0; rows && i < rows.length; i++) {
                    var where = index('section_id', rows[i]['section_id']);
                    if (where === -1) {
                        rows[i].timeslots = [];
                        rows[i].timeslots.push({
                            'day_of_week': rows[i]['day_of_week'],
                            'start_time': rows[i]['start_time'],
                            'end_time': rows[i]['end_time']
                        });
                        delete rows[i]['timeslot_id'];
                        delete rows[i]['day_of_week'];
                        delete rows[i]['start_time'];
                        delete rows[i]['end_time'];
                        formattedSections.push(rows[i]);
                    } else {
                        formattedSections[where].timeslots.push({
                            'day_of_week': rows[i]['day_of_week'],
                            'start_time': rows[i]['start_time'],
                            'end_time': rows[i]['end_time']
                        });
                        delete rows[i]['timeslot_id'];
                        delete rows[i]['day_of_week'];
                        delete rows[i]['start_time'];
                        delete rows[i]['end_time'];
                    }
                }
                function index(key, value) {
                    for (var i = 0; i < formattedSections.length; i++) {
                        if (formattedSections[i][key] === value) {
                            return i;
                        }
                    }
                    return -1;
                };
                callback(null, formattedSections);
            });
        }
    ], function (err, rows) {
        if (rows && rows.length > 0) {
            res.send(rows);
        } else {
            res.status(404).send('Class with semester_id: ' + class_id + ' not found.');
        }
    });
});

module.exports = router;



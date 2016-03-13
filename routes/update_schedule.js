var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var Q = require('q');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

var schedule_id = -1;
var section_id = -1;

/**
 * Mandatory params: section_id
 * Optional param: delete. If provided, will remove the provided section_id
 * from the schedule.
 */

router.use(function(req, res, next) {
    if (!req.body || !req.body.section_id) {
        return res.send('section_id is required.', 400);
    }
    
    schedule_id = req.schedule_id.trim();
    section_id = req.body.section_id.trim();
    
    if (req.body.delete) {
        delete_section_from_schedule(res);
    } else {
        add_section_to_schedule(res);
    }
});

function delete_section_from_schedule(res) {
    async.waterfall([
        function(callback) {
            db.run('delete from sectionschedule where schedule_id = $schedule_id ' + 
                'and section_id = $section_id);', {
                $schedule_id: schedule_id,
                $section_id: section_id
            }, function(err) {
                callback(err);
            });
        }
    ], function (err) {
        if (err) {
            return res.send(err, 200);
        } else {
            return res.status('Successfully deleted section from schedule', 200);
        }
    });
};

function add_section_to_schedule(res) {
    async.waterfall([
        function getTimeslotsBySectionID(callback) {
            db.all('select * from timeslot where section_id = $section_id;', {
                $section_id: section_id
            }, function(err, rows) {
                callback(err, rows);
            });    
        },
        function getScheduleSectionsByWeekday(timeslots, callback) {
            var days_of_week = [];
            for (var i = 0; i < timeslots.length; i++) {
                if (days_of_week.indexOf(timeslots[i]['day_of_week']) === -1) {
                    days_of_week.push("'" + timeslots[i]['day_of_week'] + "'");
                }
            }
            db.all('select ts.day_of_week, ts.start_time, ts.end_time from sectionschedule ss ' +
                'inner join timeslot ts on (ss.timeslot_id = ts.timeslot_id) where ts.day_of_week ' +
                'in (' + days_of_week.toString() + ') and ss.schedule_id = ' + schedule_id + ';', 
                function(err, rows) {
                    callback(err, timeslots, rows);
                }
            );
        }, 
        function checkForTimeConflicts(timeslots, section_schedules, callback) {
            var haveConflict = false;
            var error = 'Error: could not insert section_id: ' + 
                section_id + ' into schedule_id: ' + schedule_id + 
                ' because time conflict exists.';
            
            for (var i = 0; haveConflict === false && i < section_schedules.length; i++) {
                var section_schedule = section_schedules[i];
                for (var j = 0; haveConflict === false && j < timeslots.length; j++) {
                    var timeslot = timeslots[j];
                    if (timeslot['day_of_week'] === section_schedule['day_of_week']) {
                        var hour = timeslot['start_time'].substring(
                            0, timeslot['start_time'].indexOf(':')
                        );
                        var min = timeslot['start_time'].substring(
                            timeslot['start_time'].indexOf(':') + 1
                        );
                        var newStartTime = new Date(0, 0, 0, hour, min, 0, 0);
                        hour = section_schedule['start_time'].substring(
                            0, section_schedule['start_time'].indexOf(':')
                        );
                        min = section_schedule['start_time'].substring(
                            section_schedule['start_time'].indexOf(':') + 1
                        );
                        var currStartTime = new Date(0, 0, 0, hour, min, 0, 0);
                        hour = timeslot['end_time'].substring(
                            0, timeslot['end_time'].indexOf(':')
                        );
                        min = timeslot['end_time'].substring(
                            timeslot['end_time'].indexOf(':') + 1
                        );
                        var newEndTime = new Date(0, 0, 0, hour, min, 0, 0);
                        hour = section_schedule['end_time'].substring(
                            0, section_schedule['end_time'].indexOf(':')
                        );
                        min = section_schedule['end_time'].substring(
                            section_schedule['end_time'].indexOf(':') + 1
                        );
                        var currEndTime = new Date(0, 0, 0, hour, min, 0, 0);
                        
                        if (newStartTime < currStartTime) {
                            if (newEndTime > currStartTime) {
                                haveConflict = true;
                            }
                        } else {
                            if (newStartTime < currEndTime) {
                                haveConflict = true;
                            }
                        }
                    } 
                }
            }
            if (haveConflict === true) {
                callback(error, null, null);
            } else {
                callback(null, haveConflict, timeslots);
            }
        }, 
        function insertAllIntoDB(haveConflict, timeslots, callback) {
            var promises = [];
            for (var i = 0; i < timeslots.length; i++) {
                promises.push(insertSingleIntoDB(timeslots[i]['timeslot_id']));
            }
            Q.all(promises).then(function() {
                callback(null);
            });
        }
    ], function(err) {
        if (err) {
            return res.send(err, 200);
        } else {
            return res.send('Successfully added new section to schedule.', 200);
        }
    });
};

function insertSingleIntoDB(timeslot_id) {
    var deferred = Q.defer();
    db.run('insert into sectionschedule(schedule_id, section_id, timeslot_id) ' +
        'select $schedule_id, $section_id, $timeslot_id where not exists (' +
        'select * from sectionschedule where schedule_id = $schedule_id and ' +
        'section_id = $section_id and timeslot_id = $timeslot_id);', {
        $schedule_id: schedule_id,
        $section_id: section_id,
        $timeslot_id: timeslot_id
    }, function(err) {
        deferred.resolve(err);
    });
    return deferred.promise;
};

module.exports = router;



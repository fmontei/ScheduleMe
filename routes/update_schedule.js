var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Mandatory params: schedule_id, section_id, timeslot_id
 * Optional param: delete. If provided, will remove the section_id/timeslot_id
 * from the schedule.
 */
router.use(function(req, res, next) {
    if (!req.body || !req.body.schedule_id || !req.body.section_id || 
        !req.body.timeslot_id) {
        return res.sendStatus(400);
    }
    
    if (req.body.delete) {
        delete_section_from_schedule();
    } else {
        add_section_to_schedule();
    }
});

function delete_section_from_schedule() {
    async.waterfall([
        function(callback) {
            var username = req.body.user_id;
            db.run('delete from sectionschedule where schedule_id = $schedule_id ' + 
                'and section_id = $section_id and timeslot_id = $timeslot_id);', {
                $schedule_id: req.body.schedule_id.trim(),
                $section_id: req.body.section_id.trim(),
                $timeslot_id: req.body.timeslot_id.trim()
            }, function(err) {
                callback(err);
            });
        }
    ], function (err) {
        if (err) {
            return res.status(500).send(err);
        } else {
            return res.status(200).redirect(req.header('Referer') || '/');
        }
    });
};

function add_section_to_schedule() {
    async.waterfall([
        function(callback) {
            var username = req.body.user_id;
            db.run('insert into sectionschedule(schedule_id, section_id, timeslot_id) ' +
                'values($schedule_id, $section_id, $timeslot_id) where not exists (' +
                'select * from sectionschedule where schedule_id = $schedule_id,' +
                'section_id = $section_id, timeslot_id = $timeslot_id);', {
                $schedule_id: req.body.schedule_id.trim(),
                $section_id: req.body.section_id.trim(),
                $timeslot_id: req.body.timeslot_id.trim()
            }, function(err) {
                callback(err);
            });
        }
    ], function (err) {
        if (err) {
            return res.status(500).send(err);
        } else {
            return res.status(200).redirect(req.header('Referer') || '/');
        }
    });
};

module.exports = router;



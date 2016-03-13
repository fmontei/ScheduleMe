var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

router.use(function(req, res, next) {
    async.waterfall([
        function(callback) {
            db.all('select * from sectionschedule where schedule_id = ' +
                '$schedule_id and section_id = $section_id;', {
                $schedule_id: req.schedule_id,
                $section_id: req.section_id
            }, function(err, rows) {
                if (!rows || rows.length === 0) {
                    callback('Error: section_id: ' + req.section_id + 
                        ' was not found in schedule_id: ' + req.schedule_id + 
                        ' or has already been deleted.');
                } else {
                    callback(err);
                }
            });
        },
        function(callback) {
            db.run('delete from sectionschedule where schedule_id = ' +
                '$schedule_id and section_id = $section_id;', {
                $schedule_id: req.schedule_id,
                $section_id: req.section_id
            }, function(err) {
                callback(err);
            });
        }
    ], function (err) {
        if (err !== null) {
            return res.send(err, 200);
        } else {
            return res.send('Successfully removed section_id: ' + 
                req.section_id + ' from schedule_id: ' + 
                req.schedule_id + '.', 200);
        }
    });
});

module.exports = router;

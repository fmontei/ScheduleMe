var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var async = require('async');

var router = express.Router();
var db = new sqlite3.Database('scheduleme.db');

/**
 * Get all classes by semester id.
 */
router.use(function(req, res, next) {
    var semester_id = req.semester_id;

    if (!semester_id) {
        return res.status(400).send('url request must end with /:semester_id.');
    }

    async.waterfall([
        function(callback) {
            semester_id = semester_id.trim();
            var query = "SELECT * from class WHERE semester_id = '" + semester_id
                + "' order by department, class_number;";
            db.all(query, function(err, rows) {
                callback(null, rows);
            });
        }
    ], function (err, rows) {
        if (rows && rows.length > 0) {
            res.send(rows);
        } else {
            res.status(404).send('Class with semester_id: ' + semester_id + ' not found.');
        }
    });
});

module.exports = router;


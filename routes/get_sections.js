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
            var query = "SELECT * from section WHERE class_id = '" + class_id + "';";
            db.all(query, function(err, rows) {
                callback(null, rows);
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



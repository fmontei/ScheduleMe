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
    // TODO
    res.status(501).send('Not yet implemented.');
});


module.exports = router;



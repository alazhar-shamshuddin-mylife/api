const { body,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

var Note = require('../models/note');
var Person = require('../models/person');
var Tag = require('../models/tag');
var async = require('async');

exports.index = function(req, res) {

    async.parallel({
        person_count: function(callback) {
            Person.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        note_count: function(callback) {
            Note.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
        tag_count: function(callback) {
            Tag.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
        },
    }, function(err, results) {
        res.render('index', { title: 'My Life', error: err, data: results });
    });
};
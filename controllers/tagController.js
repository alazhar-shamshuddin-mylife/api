/**
 * This file handles all API end-points related to tags.
 *
 * @author Alazhar Shamshuddin.
 */

const { body, validationResult } = require('express-validator');
const async = require('async');
const Tag = require('../models/tag');

/**
 * @todo: Complete me.
 */
async function validateReqBody(req, res, next) {
  await body('name', 'A tag name is required and must be less than 25 characters long.')
    .trim()
    .isLength({ min: 1, max: 25 })
    .run(req);

  await body('description', 'Description is required but it can be an empty string.')
    .exists()
    .trim()
    .run(req);

  await body('image')
    .optional()
    .run(req);

  await body('isType', 'IsType is required and it must be either true or false.')
    .trim()
    .isBoolean()
    .run(req);

  await body('isTag', 'IsTag is required and it must be either true or false.')
    .trim()
    .isBoolean()
    .run(req);

  await body('isWorkout', 'IsWorkout is required and it must be either true or false.')
    .trim()
    .isBoolean()
    .run(req);

  await body('isPerson', 'IsPerson is required and it must be either true or false.')
    .trim()
    .isBoolean()
    .run(req);

  // Extract the validation errors from a request.
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(422).json({
      errors: validationErrors.array(),
      body: req.body,
      function: 'validateReqBody',
    });
  }

  return next();
}

/**
 * @todo: Complete me.
 */
function validateReqDataForCreate(req, res, next) {
  const errors = [];

  async.parallel({
    tag: (callback) => {
      Tag.find({ name: req.body.name }).exec(callback);
    },
  },
  (err, results) => {
    if (err) {
      errors.push(err);
    }

    // Check that the user supplied tag does not already exist.
    if (results.tag.length !== 0) {
      errors.push({ error: `A tag called '${req.body.name}' already exists.` });
    }

    if (errors.length > 0) {
      return res.status(500).json({
        errors,
        body: req.body,
        function: 'validateReqDataForCreate',
      });
    }

    req.queryResults = results;

    return next();
  });
}

/**
 * @todo: Complete me.
 */
function validateReqDataForUpdate(req, res, next) {
  const errors = [];

  async.parallel({
    tag: (callback) => {
      Tag.find({ _id: req.params.id }).exec(callback);
    },

    tagByName: (callback) => {
      Tag.find({ name: req.body.name }).exec(callback);
    },
  },
  (err, results) => {
    if (err) {
      errors.push(err);
    }

    // Check that the user supplied tag name does not already exist.
    if (results.tagByName.length > 1) {
      errors.push({ error: `There are '${results.tagByName.length}' tags with the name ${req.body.name}; there should be only one.` });
    }

    if (results.tagByName.length === 1 && results.tagByName[0]._id.toString() !== req.params.id) {
      errors.push({ error: `A tag called '${req.body.name}' already exists.` });
    }

    if (results.tag.length === 0) {
      errors.push({ error: `A tag with ID '${req.params.id}' does not exist.` });
    }

    if (results.tag.length > 1) {
      errors.push({ error: `There are '${results.tag.length}' tags with ID '${req.params.id}' where one was expected.` });
    }

    if (errors.length > 0) {
      return res.status(500).json({
        errors,
        body: req.body,
        function: 'validateReqDataForUpdate',
      });
    }

    req.queryResults = results;

    return next();
  });
}

/**
 * @todo: Complete me.
 */
function createTag(req, res) {
  const tag = new Tag();
  tag.name = req.body.name;
  tag.description = req.body.description;
  tag.image = req.body.image;
  tag.isType = req.body.isType;
  tag.isTag = req.body.isTag;
  tag.isWorkout = req.body.isWorkout;
  tag.isPerson = req.body.isPerson;

  tag.save((err) => {
    if (err) {
      return res.status(500).json({
        errors: err,
        body: req.body,
      });
    }

    return res.status(201).json({
      message: 'New tag created!',
      data: tag,
    });
  });
}

/**
 * @todo: Complete me.
 */
function updateTag(req, res) {
  const tag = req.queryResults.tag[0];
  tag.name = req.body.name;
  tag.description = req.body.description;
  tag.image = req.body.image;
  tag.isType = req.body.isType;
  tag.isTag = req.body.isTag;
  tag.isWorkout = req.body.isWorkout;
  tag.isPerson = req.body.isPerson;

  tag.save((err) => {
    if (err) {
      return res.status(500).json({
        errors: err,
        body: req.body,
      });
    }

    return res.status(200).json({
      message: 'Tag updated!',
      data: tag,
    });
  });
}

/**
 * Creates a new tag.
 *
 * Processes the API route /api/tag.
 */
exports.create = [
  validateReqBody,
  validateReqDataForCreate,
  createTag,
];

/**
 * Update (put) the specified tag.
 *
 * Processes the API route PUT /api/tag/:id.
 *
 * @param {} req
 * @param {} res
 * @param {} next
 */
exports.update = [
  validateReqBody,
  validateReqDataForUpdate,
  updateTag,
];

exports.index = (req, res) => {
  async.parallel({
    tag_count(callback) {
      // Pass an empty object as a match condition to find all documents of this
      // collection.
      Tag.countDocuments({}, callback);
    },
  }, (err, results) => {
    res.render('index', { title: 'My Life', error: err, data: results });
  });
};

// Display list of all Books.
exports.list = (req, res, next) => {
  Tag.find()
    .sort([['tag', 'ascending']])
    .exec((err, listTags) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('tagList', { title: 'Tag List', tagList: listTags });
    });
};

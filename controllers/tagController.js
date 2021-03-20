/**
 * This file handles all API end-points related to tags.
 *
 * @author Alazhar Shamshuddin.
 */

const { body, validationResult } = require('express-validator');
const async = require('async');
const Note = require('../models/note');
const Person = require('../models/person');
const Tag = require('../models/tag');
const Workout = require('../models/workout');

//------------------------------------------------------------------------------
// Public (Exported) Functions
//------------------------------------------------------------------------------

/**
 * Get the total number of tags.
 *
 * Processes the API route GET /api/tags/count.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the total number
 *                    of tags in the database.
 */
exports.count = (req, res) => {
  Tag.estimatedDocumentCount((err, count) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err] });
    }

    return res.status(200).json({ status: 'ok', messages: [], data: count });
  });
};

/**
 * Creates a new tag.
 *
 * Processes the API route /api/tags.
 */
exports.create = [
  validateReqBody,
  validateReqDataForCreate,
  createTag,
];

/**
 * Deletes the specified tag.
 *
 * Processes the API route DELETE /api/tags/:id.
 */
exports.delete = [
  validateReferentialIntegrity,
  deleteTag,
];

/**
 * Reads (gets) the specified tag.
 *
 * Processes the API route GET /api/tags/:id.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the resulting
 *                    note.
 */
exports.read = (req, res) => {
  Tag
    .findById(req.params.id)
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ status: 'error', messages: [err], data: req.params.id });
      }

      if (!results) {
        const msg = `Could not find a note with ID '${req.params.id}'.`;
        return res.status(404).json({ status: 'error', messages: [msg], data: req.params.id });
      }

      return res.status(200).json({ status: 'ok', messages: [], data: results });
    });
};

/**
 * Reads (gets) all tags.
 *
 * Processes the API route GET /api/tags.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the resulting
 *                    notes.
 */
exports.readAll = (req, res) => {
  Tag
    .find()
    .sort({ name: 'ascending' })
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ status: 'error', messages: [err] });
      }

      return res.status(200).json({ status: 'ok', messages: [], data: results });
    });
};

/**
 * Updates (replaces) the specified tag.
 *
 * Processes the API route PUT /api/tags/:id.
 */
exports.update = [
  validateReqBody,
  validateReqDataForUpdate,
  updateTag,
];

//------------------------------------------------------------------------------
// Helpers Functions
//------------------------------------------------------------------------------

/**
 * Creates a new tag as specified in the HTTP request object.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response containing error information or a copy
 *                    of the new note that was created.
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
      return res.status(500).json({ status: 'error', messages: [err], data: req.body });
    }

    return res.status(201).json({ status: 'ok', messages: [], data: tag });
  });
}

/**
 * Deletes the specified tag.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the deleted tag.
 */
 function deleteTag(req, res) {
  Tag
    .findByIdAndRemove(req.params.id)
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ status: 'error', messages: [err], data: req.params.id });
      }

      if (!results) {
        const msg = `Could not find a tag with ID '${req.params.id}'.`;
        return res.status(404).json({ status: 'error', messages: [msg], data: req.params.id });
      }

      return res.status(200).json({ status: 'ok', messages: [], data: results });
    });
}

/**
 * Updates an existing tag as specified in the HTTP request object.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response containing error information or a copy
 *                    of the updated tag.
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
 * Validates that the specified tag can be deleted without violating
 * referential integrity.  In other words, a tag can only be deleted if it is
 * not referenced in any of the following models/fields (collection/fields):
 *   - Note.tags (note.tags)
 *   - Note.type (notes.type)
 *   - Workout.workout (notes.workout)
 *   - Person.tags (people.tags)
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer to the next Express middleware
 *                         function that should be called.
 *
 * @return {@todo} An HTTP error response or next middleware function.
 */
function validateReferentialIntegrity(req, res, next) {
  async.parallel({
    noteTags: (callback) => {
      Note.find({ tags: req.params.id }).countDocuments().exec(callback);
    },
    noteTypes: (callback) => {
      Note.find({ type: req.params.id }).countDocuments().exec(callback);
    },
    noteWorkouts: (callback) => {
      // Note.find({ workout: req.params.id }).countDocuments().exec(callback);
      Workout.find({ workout: req.params.id }).countDocuments().exec(callback);
    },
    peopleTags: (callback) => {
      Person.find({ tags: req.params.id }).countDocuments().exec(callback);
    },
  },
  (err, results) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err], data: req.params.id });
    }

    if (!results) {
      const msg = 'Unexpected error: could not any data.';
      return res.status(500).json({ status: 'error', messages: [msg], data: req.params.id });
    }

    if (results.noteTags > 0
      || results.noteTypes > 0
      || results.noteWorkouts > 0
      || results.peopleTags > 0) {
      let msg = `Cannot delete tag with ID '${req.params.id}' without breaking referential integrity.`;
      msg = `${msg}  The tag is referenced in:`;

      const referenceList = [];

      if (results.noteTypes > 0) {
        referenceList.push(`${results.noteTypes} notes.type`);
      }

      if (results.noteTags > 0) {
        referenceList.push(`${results.noteTags} notes.tags`);
      }

      if (results.noteWorkouts > 0) {
        referenceList.push(`${results.noteWorkouts} notes.workout`);
      }

      if (results.peopleTags > 0) {
        referenceList.push(`${results.peopleTags} people.tags`);
      }

      msg = `${msg} ${referenceList.join(', ')} field(s).`;
      return res.status(422).json({ status: 'error', messages: [msg], data: req.params.id });
    }

    // Proceed to the functions in the array of functions that define
    // exports.delete.
    return next();
  });
}

/**
 * Validates an HTTP request body to ensure it contains a valid new tag.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer the next Express middleware
 *                         function that should be called.
 *
 * @return {@todo} An HTTP error response or next middleware function.
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
      status: 'error',
      messages: validationErrors.array(),
      data: req.body,
      function: 'validateReqBody',
    });
  }

  return next();
}

/**
 * Validates the data in the HTTP request body to ensure the new tag is
 * valid.  That is, this function confirms that the a tag with the same name
 * does not already exist.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer to the next Express middleware
 *                         function that should be called.
 *
 * @return {@todo} An HTTP error response or next middleware function.
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
      errors.push(`A tag called '${req.body.name}' already exists.`);
    }

    if (errors.length > 0) {
      return res.status(500).json({
        status: 'error',
        messages: errors,
        data: req.body,
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

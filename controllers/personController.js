/**
 * This file handles all API end-points related to people.
 *
 * @author Alazhar Shamshuddin.
 */

const { body, validationResult } = require('express-validator');
const async = require('async');
const arrayHelper = require('../helpers/arrayHelper');
const Person = require('../models/person');
const Tag = require('../models/tag');

//------------------------------------------------------------------------------
// Public (Exported) Functions
//------------------------------------------------------------------------------

/**
 * Get the total number of people.
 *
 * Processes the API route GET /api/people/count.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the total number
 *                    of people in the database.
 */
exports.count = (req, res) => {
  Person.estimatedDocumentCount((err, count) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err] });
    }

    return res.status(200).json({ status: 'ok', messages: [], data: count });
  });
};

/**
 * Creates a new person.
 *
 * Processes the API route /api/people by executing a series of helper
 * (middleware?) functions.
 */
exports.create = [
  validateReqBody,
  validateReqDataForCreate,
  createPerson,
];

/**
 * Deletes the specified person.
 *
 * Processes the API route DELETE /api/people/:id.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the deleted person.
 */
exports.delete = (req, res) => {
  Person
    .findByIdAndRemove(req.params.id)
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ status: 'error', messages: [err], data: req.params.id });
      }

      if (!results) {
        const msg = `Could not find a person with ID '${req.params.id}'.`;
        return res.status(404).json({ status: 'error', messages: [msg], data: req.params.id });
      }

      return res.status(200).json({ status: 'ok', messages: [], data: results });
    });
};

/**
 * Reads (gets) the specified person.
 *
 * Processes the API route GET /api/people/:id.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the resulting
 *                    person.
 */
exports.read = (req, res) => {
  Person
    .findById(req.params.id)
    .populate('tags')
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ status: 'error', messages: [err], data: req.params.id });
      }

      if (!results) {
        const msg = `Could not find a person with ID '${req.params.id}'.`;
        return res.status(404).json({ status: 'error', messages: [msg], data: req.params.id });
      }

      return res.status(200).json({ status: 'ok', messages: [], data: results });
    });
};

/**
 * Reads (gets) all people.
 *
 * Processes the API route GET /api/people.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the resulting
 *                    people.
 */
exports.readAll = (req, res) => {
  Person
    .find()
    .sort({ firstName: 'ascending', lastName: 'ascending' })
    .populate('tags')
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ status: 'error', messages: [err] });
      }

      return res.status(200).json({ status: 'ok', messages: [], data: results });
    });
};

/**
 * Updates (replaces) the specified person with the provided person.
 *
 * Processes the API route PUT /api/people/:id.
 */
exports.update = [
  validateReqBody,
  validateReqDataForUpdate,
  updatePerson,
];

//------------------------------------------------------------------------------
// Helpers Functions
//------------------------------------------------------------------------------

/**
 * Creates a new person as specified in the HTTP request object.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response containing error information or a copy
 *                    of the new person that was created.
 */
function createPerson(req, res) {
  const person = new Person();
  person.firstName = req.body.firstName;
  person.middleName = req.body.middleName;
  person.lastName = req.body.lastName;
  person.preferredName = req.body.preferredName;
  person.birthdate = req.body.birthdate;
  person.tags = [];
  person.notes = req.body.notes;
  person.googlePhotoUrl = req.body.googlePhotoUrl;
  person.picasaContactId = req.body.picasaContactId;
  person.photos = req.body.photos;

  req.queryResults.tags.forEach((object) => {
    person.tags.push(object._id);
  });

  person.save((err) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err], data: req.body });
    }

    return res.status(201).json({ status: 'ok', messages: [], data: person });
  });
}

/**
 * Updates an existing person as specified in the HTTP request object.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response containing error information or a copy
 *                    of the updated person.
 */
function updatePerson(req, res) {
  const person = req.queryResults.people[0];
  person.firstName = req.body.firstName;
  person.middleName = req.body.middleName;
  person.lastName = req.body.lastName;
  person.preferredName = req.body.preferredName;
  person.birthdate = req.body.birthdate;
  person.tags = [];
  person.notes = req.body.notes;
  person.googlePhotoUrl = req.body.googlePhotoUrl;
  person.picasaContactId = req.body.picasaContactId;
  person.photos = req.body.photos;

  req.queryResults.tags.forEach((object) => {
    person.tags.push(object._id);
  });

  person.save((err) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err], data: req.body });
    }

    return res.status(200).json({ status: 'ok', messages: [], data: person });
  });
}

/**
 * Validates an HTTP request body to ensure it contains a valid new person.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer the next Express middleware
 *                         function that should be called.
 */
async function validateReqBody(req, res, next) {
  await body('firstName', 'First name is required; it must be between 1 and 25 characters long.')
    .trim()
    .isLength({ min: 1, max: 25 })
    .run(req);

  await body('middleName', 'Middle is required; it must be between 0 and 25 characters long.')
    .exists()
    .trim()
    .isLength({ max: 25 })
    .run(req);

  await body('lastName', 'Last name is required; it must be between 0 and 25 characters long.')
    .exists()
    .trim()
    .isLength({ max: 25 })
    .run(req);

  await body('preferredName', 'Preferred name is required; it must be between 0 and 25 characters long.')
    .exists()
    .trim()
    .isLength({ max: 25 })
    .run(req);

  await body('birthdate', 'Birthdate must be a valid date if it is specified.')
    .optional()
    .trim()
    .isDate()
    .run(req);

  await body('googlePhotoUrl', 'A Google Photo URL is required; it must be between 0 and 250 characters long.')
    .exists()
    .trim()
    .isLength({ max: 250 })
    .run(req);

  await body('picasaContactId', 'A Picasa Contact ID is required; it can be an empty string or a 16-character ID.')
    .exists()
    .trim()
    .custom((value) => value.length === 0 || value.length === 16)
    .run(req);

  await body('tags')
    .isArray()
    .withMessage('Tags must be specified in an array.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate tags are not allowed.')
    .custom((value) => value.length > 0)
    .withMessage('The tag must contain at least one value.')
    .run(req);

  await body('notes')
    .isArray()
    .withMessage('Notes must be specified in an array; an empty array is okay.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate notes are not allowed.')
    .run(req);

  await body('notes.*.date', 'A note date must be a valid date.')
    .optional()
    .trim()
    .isDate()
    .run(req);

  await body('notes.*.note', 'A note is required.')
    .exists()
    .trim()
    .isLength({ min: 1 })
    .run(req);

  await body('photos')
    .isArray()
    .withMessage('Photos must be specified in an array; an empty array is okay.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate photos are not allowed.')
    .run(req);

  await body('photos.*.image', 'An image must be specified.')
    .exists()
    .run(req);

  // Extract the validation errors from a request.
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    return res.status(422).json({
      status: 'error',
      messages: validationErrors.array(),
      data: req.body,
    });
  }

  return next();
}

/**
 * Validates the data in the HTTP request body to ensure the new person is
 * valid.  That is, this function confirms that the new person refers to
 * valid/existing tags references, for example.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer to the next Express middleware
 *                         function that should be called.
 *
 * @return {@todo} An HTTP error response or next middleware function.
 */
function validateReqDataForCreate(req, res, next) {
  async.parallel({
    people: (callback) => {
      Person.find({
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
      }).exec(callback);
    },

    tags: (callback) => {
      Tag.find({ name: { $in: req.body.tags }, isPerson: true }).exec(callback);
    },
  },
  (err, results) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err], data: req.body });
    }

    // Check that the person does not already exist.
    if (results.people.length !== 0) {
      const msg = `A person with following first, middle and last names already exist: '${req.body.firstName}', '${req.body.middleName}', '${req.body.lastName}'.`;
      return res.status(422).json({ status: 'error', messages: [msg], data: req.body });
    }

    // Check that all user supplied tag names are valid (i.e., they exist in
    // the tags database collection).
    if (!arrayHelper.areNamesValid(results.tags, req.body.tags, false)) {
      const invalidTags = arrayHelper.getMissingItems(results.tags, req.body.tags);
      const msg = `Invalid tag(s): ${invalidTags.join(', ')}.`;
      return res.status(422).json({ status: 'error', messages: [msg], data: req.body });
    }

    req.queryResults = results;
    return next();
  });
}

/**
 * Validates the data in the HTTP request body to ensure the updated person is
 * valid.  That is, this function confirms that the updated person still refers
 * to valid/existing tag references, for example.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer to the next Express middleware
 *                         function that should be called.
 *
 * @return {@todo} An HTTP error response or next middleware function.
 */
function validateReqDataForUpdate(req, res, next) {
  async.parallel({
    people: (callback) => {
      Person.find({ _id: req.params.id }).exec(callback);
    },

    peopleByName: (callback) => {
      Person.find({
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
      }).exec(callback);
    },

    tags: (callback) => {
      Tag.find({ name: { $in: req.body.tags }, isPerson: true }).exec(callback);
    },
  },
  (err, results) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err], data: req.body });
    }

    if (!results) {
      const msg = 'Unexpected error: could not find any data.';
      return res.status(500).json({ status: 'error', messages: [msg], data: req.body });
    }

    if (results.people.length > 1) {
      const msg = `There are '${results.people.length}' people with ID '${req.params.id}'; there should be only one.`;
      return res.status(500).json({ status: 'error', messages: [msg], data: req.body });
    }

    // Check that the user supplied person name does not already exist.
    if (results.peopleByName.length > 1) {
      const msg = `There are '${results.peopleByName.length}' people with the name '${req.body.firstName} ${req.body.middleName} ${req.body.lastName}'; there should be only one.`;
      return res.status(500).json({ status: 'error', messages: [msg], data: req.body });
    }

    if (results.peopleByName.length === 1
      && results.peopleByName[0]._id.toString() !== req.params.id) {
      const msg = `A person called '${results.peopleByName[0].name}' already exists.`;
      return res.status(422).json({ status: 'error', messages: [msg], data: req.body });
    }

    if (results.people.length === 0) {
      const msg = `A person with ID '${req.params.id}' does not exist.`;
      return res.status(422).json({ status: 'error', messages: [msg], data: req.body });
    }

    // Check that all user supplied tag names are valid (i.e., they exist
    // in the tags database collection).
    if (!arrayHelper.areNamesValid(results.tags, req.body.tags, false)) {
      const invalidTags = arrayHelper.getMissingItems(results.tags, req.body.tags);
      const msg = `Invalid tag(s): ${invalidTags.join(', ')}.`;
      return res.status(422).json({ status: 'error', messages: [msg], data: req.body });
    }

    req.queryResults = results;
    return next();
  });
}

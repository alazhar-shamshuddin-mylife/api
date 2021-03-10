/**
 * This file handles all API end-points related to people.
 *
 * @author Alazhar Shamshuddin.
 */

const { body, validationResult } = require('express-validator');
const async = require('async');
const {
  areNamesValid,
  containsDuplicates,
  getMissingItems,
} = require('./helperController');
const Person = require('../models/person');
const Tag = require('../models/tag');

//------------------------------------------------------------------------------
// Helpers Functions
//------------------------------------------------------------------------------

/**
 * Creates a new person as specified in the HTTP request object.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
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
      return res.status(500).json({
        errors: [err],
        data: req.body,
      });
    }

    return res.status(201).json({
      message: 'New person created!',
      data: person,
    });
  });
}

/**
 * Updates an existing person as specified in the HTTP request object.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
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
      return res.status(500).json({
        errors: [err],
        data: req.body,
      });
    }

    return res.status(201).json({
      message: 'Person updated!',
      data: person,
    });
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
  await body('firstName', 'First name is required and must be less than 25 characters long.')
    .trim()
    .isLength({ min: 1, max: 25 })
    .run(req);

  await body('middleName', 'Middle is required but it can be an empty string.')
    .exists()
    .trim()
    .isLength({ max: 25 })
    .run(req);

  await body('lastName', 'Last name is required and must be less than 25 characters long.')
    .trim()
    .isLength({ max: 25 })
    .run(req);

  await body('preferredName', 'Preferred name is required but it can be an empty string.')
    .exists()
    .trim()
    .isLength({ max: 25 })
    .run(req);

  await body('birthdate', 'Birthdate must be a valid date.')
    .optional()
    .trim()
    .isDate()
    .run(req);

  await body('googlePhotoUrl', 'A Google Photo URL is required but it can be an empty string.')
    .exists()
    .trim()
    .isLength({ max: 250 })
    .run(req);

  await body('picasaContactId', 'A Picasa Contact ID is required; it can be an empty string or a 16-character ID.')
    .exists()
    .trim()
    .custom((value) => value.length <= 16)
    .run(req);

  await body('tags')
    .isArray()
    .withMessage('Tags must be specified in an array.')
    .not()
    .custom(containsDuplicates)
    .withMessage('Duplicate tags are not allowed.')
    .custom((value) => value.length > 0)
    .withMessage('The tag must contain at least one value.')
    .run(req);

  await body('notes')
    .isArray()
    .withMessage('Notes must be specified in an array; an empty array is okay.')
    .not()
    .custom(containsDuplicates)
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
    .custom(containsDuplicates)
    .withMessage('Duplicate photos are not allowed.')
    .run(req);

  await body('photos.*.image', 'An image must be specified.')
    .exists()
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
    const errors = [];

    if (err) {
      errors.push(err);
    }

    // Check that the person does not already exist.
    if (results.people.length !== 0) {
      errors.push({ error: `A person with following first, middle and last names already exist: '${req.body.firstName}', '${req.body.middleName}', '${req.body.lastName}'.` });
    }

    // Check that all user supplied tag names are valid (i.e., they exist
    // in the tags database collection).
    if (!areNamesValid(results.tags, req.body.tags, false)) {
      const invalidTags = getMissingItems(results.tags, req.body.tags);
      errors.push({ error: `Invalid tag(s): ${invalidTags.join(', ')}` });
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
 * Validates the data in the HTTP request body to ensure the updated person is
 * valid.  That is, this function confirms that the updated person still refers
 * to valid/existing tags references, for example.
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
    const errors = [];

    if (err) {
      errors.push(err);
    }

    // Check that the user supplied person name does not already exist.
    if (results.peopleByName.length > 1) {
      errors.push({ error: `There are '${results.peopleByName.length}' people with the name '${req.body.firstName} ${req.body.middleName} ${req.body.lastName}' ; there should be only one.` });
    }

    if (results.peopleByName.length === 1
      && results.peopleByName[0]._id.toString() !== req.params.id) {
      errors.push({ error: `A person called '${results.peopleByName[0].name}' already exists.` });
    }

    if (results.people.length === 0) {
      errors.push({ error: `A person with ID '${req.params.id}' does not exist.` });
    }

    if (results.people.length > 1) {
      errors.push({ error: `There are '${results.people.length}' tags with ID '${req.params.id}' where one was expected.` });
    }

    // Check that all user supplied tag names are valid (i.e., they exist
    // in the tags database collection).
    if (!areNamesValid(results.tags, req.body.tags, false)) {
      const invalidTags = getMissingItems(results.tags, req.body.tags);
      errors.push({ error: `Invalid tag(s): ${invalidTags.join(', ')}` });
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
      return res.status(500).json({ errors: [err] });
    }

    return res.status(200).json({ data: count });
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
        return res.status(500).json({ errors: [err] });
      }

      if (!results) {
        return res.status(404).json({
          errors: [{ error: `Could not find a person with ID '${req.params.id}'.` }],
        });
      }

      return res.status(200).json({
        message: `Successfully deleted person '${req.params.id}'.`,
        data: results,
      });
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
        const errors = [];
        errors.push(err);
        errors.push({ error: 'Encountered an error getting all people.' });
        return res.status(500).json({ errors });
      }

      return res.status(200).json({ data: results });
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
        const errors = [];
        errors.push(err);
        errors.push({ error: `Encountered an error finding a person with ID '${req.params.id}'.` });
        return res.status(500).json({ errors });
      }

      if (!results) {
        return res.status(404).json({
          errors: [{ error: `Could not find a person with ID '${req.params.id}'.` }],
        });
      }

      return res.status(200).json({ data: results });
    });
};

/**
 * Updates (replaces) the specified person with the provided person.
  *
 * Processes the API route PUT /api/people/:id.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 */
exports.update = [
  validateReqBody,
  validateReqDataForUpdate,
  updatePerson,
];

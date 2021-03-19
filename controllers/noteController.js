/**
 * This file handles all API end-points related to notes.
 *
 * @author Alazhar Shamshuddin.
 */

const { body, validationResult } = require('express-validator');
const async = require('async');
const arrayHelper = require('../helpers/arrayHelper');
const BikeRide = require('../models/bikeRide');
const Book = require('../models/book');
const Health = require('../models/health');
const Hike = require('../models/hike');
const Life = require('../models/life');
const Note = require('../models/note');
const Person = require('../models/person');
const Tag = require('../models/tag');
const Workout = require('../models/workout');

//------------------------------------------------------------------------------
// Public (Exported) Functions
//------------------------------------------------------------------------------

/**
 * Get the total number of notes.
 *
 * Processes the API route GET /api/notes/count.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the total number
 *                    of notes in the database.
 */
exports.count = (req, res) => {
  Note.estimatedDocumentCount((err, count) => {
    if (err) {
      return res.status(500).json({ status: 'error', messages: [err] });
    }

    return res.status(200).json({ status: 'ok', messages: [], data: count });
  });
};

/**
 * Creates a new note.
 *
 * Processes the API route /api/notes by executing a series of helper
 * (middleware?) functions.
 */
exports.create = [
  validateReqBody,
  validateReqData,
  createNote,
];

/**
 * Deletes the specified note.
 *
 * Processes the API route DELETE /api/notes/:id.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the deleted note.
 */
exports.delete = (req, res) => {
  Note
    .findByIdAndRemove(req.params.id)
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ errors: [err] });
      }

      if (!results) {
        return res.status(404).json({
          errors: [{ error: `Could not find a note with ID '${req.params.id}'.` }],
        });
      }

      return res.status(200).json({
        message: `Successfully deleted note '${req.params.id}'.`,
        data: results,
      });
    });
};

/**
 * Reads (gets) the specified note.
 *
 * Processes the API route GET /api/notes/:id.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the resulting
 *                    note.
 */
 exports.read = (req, res) => {
  Note
    .findById(req.params.id)
    .populate('type')
    .populate('tags')
    .populate('people')
    .exec((err, results) => {
      if (err) {
        const errors = [];
        errors.push(err);
        errors.push({ error: `Encountered an error finding a note with ID '${req.params.id}'.` });
        return res.status(500).json({ errors });
      }

      if (!results) {
        return res.status(404).json({
          errors: [{ error: `Could not find a note with ID '${req.params.id}'.` }],
        });
      }

      return res.status(200).json({ data: results });
    });
};

/**
 * Reads (gets) all notes.
 *
 * Processes the API route GET /api/notes.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response object with errors or the resulting
 *                    notes.
 */
exports.readAll = (req, res) => {
  Note
    .find()
    .sort({ date: 'descending' })
    .populate('type')
    .populate('tags')
    .populate('people')
    .exec((err, results) => {
      if (err) {
        const errors = [];
        errors.push(err);
        errors.push({ error: 'Encountered an error getting all notes.' });
        return res.status(500).json({ errors });
      }

      return res.status(200).json({ data: results });
    });
};

/**
 * Updates (replaces) the specified note with the provided note.
  *
 * Processes the API route PUT /api/notes/:id.
 *
 * @todo: This function has to be re-written...see personController.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 */
exports.update = (req, res) => {
  const updatedNote = req.body;

  Note
    .findOneAndUpdate({ _id: req.params.id }, updatedNote, { new: true })
    .exec((err, results) => {
      if (err) {
        return res.status(500).json({ errors: [err] });
      }

      return res.status(200).json({
        message: `Successfully updated note '${req.params.id}'.`,
        data: results,
      });
    });
};

//------------------------------------------------------------------------------
// Helpers Functions
//------------------------------------------------------------------------------

/**
 * Creates a bike ride note initialized as per the HTTP request object.
 *
 * @param {Request} req  The HTTP request object.
 *
 * @return {BikeRide} A bike ride note.
 */
 function createBikeRide(req) {
  let note = new BikeRide();
  note = populateBaseNote(note, req);
  note.bike = req.body.bike;
  note.metrics = req.body.metrics;
  return note;
}

/**
 * Creates a book note initialized as per the HTTP request object.
 *
 * @param {Request} req  The HTTP request object.
 *
 * @return {Book} A book note.
 */
function createBook(req) {
  let note = new Book();
  note = populateBaseNote(note, req);
  note.authors = req.body.authors;
  note.format = req.body.format;
  note.status = req.body.status;
  note.rating = req.body.rating;
  return note;
}

/**
 * Creates a health note initialized as per the HTTP request object.
 *
 * @param {Request} req  The HTTP request object.
 *
 * @return {Health} A health note.
 */
function createHealth(req) {
  let note = new Health();
  note = populateBaseNote(note, req);
  return note;
}

/**
 * Creates a hike note initialized as per the HTTP request object.
 *
 * @param {Request} req  The HTTP request object.
 *
 * @return {Hike} A hike note.
 */
function createHike(req) {
  let note = new Hike();
  note = populateBaseNote(note, req);
  note.metrics = req.body.metrics;
  return note;
}

/**
 * Creates a life note initialized as per the HTTP request object.
 *
 * @param {Request} req  The HTTP request object.
 *
 * @return {Life} A life note.
 */
function createLife(req) {
  let note = new Life();
  note = populateBaseNote(note, req);
  return note;
}

/**
 * Creates a new note of the type specified in the HTTP request object.
 *
 * @param {Request}  req  The HTTP request object.
 * @param {Response} res  The HTTP response object.
 *
 * @return {Response} An HTTP response containing error information or a copy
 *                    of the new note that was created.
 */
function createNote(req, res) {
  let note;

  switch (req.body.type) {
    case 'Bike Ride':
      note = createBikeRide(req);
      break;
    case 'Book':
      note = createBook(req);
      break;
    case 'Health':
      note = createHealth(req);
      break;
    case 'Hike':
      note = createHike(req);
      break;
    case 'Life':
      note = createLife(req);
      break;
    case 'Workout':
      note = createWorkout(req);
      break;
    default:
      return res.status(422).json({
        errors: [{ error: `Invalid note type '${req.body.type}'.` }],
        data: req.body,
      });
  }

  note.save((err) => {
    if (err) {
      return res.status(500).json({
        errors: [err],
        data: req.body,
      });
    }

    return res.status(201).json({
      message: 'New note created!',
      data: note,
    });
  });

  // Return status 102 (processing) to appease the eslint consistent-return
  // rule.  Note that this return statement is *always* executed before those
  // in note.save().  If we attempt to return a JSON object, the app will crash
  // when the return statements in note.save() execute with the following
  // error: "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they
  // are sent to the client".
  return res.status(102);
}

/**
 * Creates a workout note initialized as per the HTTP request object.
 *
 * @param {Request} req  The HTTP request object.
 *
 * @return {Workout} A workout note.
 */
function createWorkout(req) {
  let note = new Workout();
  note = populateBaseNote(note, req);
  note.workout = req.queryResults.workout[0]._id;
  note.metrics = req.body.metrics;
  return note;
}

/**
 * Populates or initializes the parts of a new note that are common to all
 * types of notes.
 *
 * @param {Note}    note  A new note object.
 * @param {Request} req   The HTTP request object.
 *
 * @return {Note} A copy of the input note with its common attributes
 *                initialized based on the HTTP request object.
 */
function populateBaseNote(note, req) {
  const returnNote = note;

  returnNote.type = req.queryResults.type[0]._id;
  returnNote.tags = [];
  returnNote.date = req.body.date;
  returnNote.title = req.body.title;
  returnNote.description = req.body.description;
  returnNote.place = req.body.place;
  returnNote.people = [];

  req.queryResults.tags.forEach((object) => {
    returnNote.tags.push(object._id);
  });

  req.queryResults.people.forEach((object) => {
    returnNote.people.push(object._id);
  });

  return returnNote;
}

/**
 * Validates parts of an HTTP request body that are common to all types of
 * notes.
 *
 * @param {Request} req  The HTTP request object.
 */
async function validateBaseNote(req) {
  await body('type', 'Type is required.')
    .trim()
    .isLength({ min: 1 })
    .run(req);

  await body('tags')
    .isArray()
    .withMessage('Tags must be specified in an array; an empty array is okay.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate tags are not allowed.')
    .not()
    .custom((value, { request }) => value.includes(request.body.type))
    .withMessage('The same tag cannot be specified in both the type and tags fields.')
    .run(req);

  await body('date', 'Date must be a valid date.')
    .trim()
    .isDate()
    .run(req);

  await body('title', 'A title between 1 and 200 characters long is required.')
    .trim()
    .isLength({ min: 1, max: 200 })
    .run(req);

  await body('description', 'A description is required.')
    .trim()
    .run(req);

  await body('people')
    .isArray()
    .withMessage('People must be specified in an array.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate names are not allowed.')
    .run(req);

  await body('place', 'Place is required but it can be an empty string.')
    .exists()
    .trim()
    .run(req);
}

/**
 * Validates the parts of an HTTP request body that are specific to "Bike Ride"
 * notes.
 *
 * @param {Request} req  The HTTP request object.
 */
async function validateBikeRide(req) {
  const bikes = BikeRide.schema.obj.bike.enum;

  // @todo: Get this from the schema.
  const metricSources = ['Bell F20 Bike Computer', 'Strava'];

  await body('bike')
    .trim()
    .isIn(bikes)
    .withMessage(`Bike must be one of: ${bikes.join(', ')}.`)
    .run(req);

  await body('metrics')
    .optional()
    .isArray()
    .withMessage('Metrics must be specified in an array if it is specified at all.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate tags are not allowed.')
    .run(req);

  await body('metrics.*.dataSource')
    .optional()
    .trim()
    .isIn(metricSources)
    .withMessage(`The metrics data source must be one of: '${metricSources.join(', ')}'.`)
    .run(req);

  await body('metrics.*.startDate', 'Start date must be a valid date.')
    .optional()
    .trim()
    .isDate()
    .run(req);

  await body('metrics.*.movingTime', 'Moving time must be an integer greater than or equal to 0 s.')
    .optional()
    .isInt({ min: 0 })
    .run(req);

  await body('metrics.*.totalTime', 'Total time must be an integer greater than or equal to 0 s.')
    .optional()
    .isInt({ min: 0 })
    .run(req);

  await body('metrics.*.distance', 'Distance must be an integer greater than or equal to 0 km.')
    .optional()
    .isFloat({ min: 0 })
    .run(req);

  await body('metrics.*.avgSpeed', 'Average speed must be greater than or equal to 0 km/h.')
    .optional()
    .isNumeric({ min: 0 })
    .run(req);

  await body('metrics.*.maxSpeed', 'Maximum speed must be greater than or equal to 0 km/h.')
    .optional()
    .isNumeric({ min: 0 })
    .run(req);

  await body('metrics.*.elevationGain', 'Elevation gain must be a number in metres.')
    .optional()
    .isNumeric()
    .run(req);

  await body('metrics.*.maxElevation', 'Maximum elevation must be a number in metres.')
    .optional()
    .isNumeric()
    .run(req);
}

/**
 * Validates the parts of an HTTP request body that are specific to "Book"
 * notes.
 *
 * @param {Request} req  The HTTP request object.
 */
async function validateBook(req) {
  // @todo: Get these enums from the model or somehow use the same definition.
  const statuses = ['Completed', 'Abandoned'];
  const formats = ['Book', 'eBook', 'Audiobook'];

  await body('authors')
    .isArray()
    .withMessage('Authors must be specified in an array.')
    .isLength({ min: 1 })
    .withMessage('At least one author is required.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate authors are not allowed.')
    .run(req);

  await body('authors.*', 'Each author\'s name is required and cannot exceed 100 characters.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .run(req);

  await body('format', `Format must be one of: ${formats.join(', ')}.`)
    .optional()
    .trim()
    .isIn(formats)
    .run(req);

  await body('status', `Status must be one of: ${statuses.join(', ')}.`)
    .trim()
    .isIn(statuses)
    .run(req);

  await body('rating', 'Rating must be an integer between 1 and 5.')
    .optional()
    .isInt({ min: 1, max: 5 })
    .run(req);
}

/**
 * Validates the parts of an HTTP request body that are specific to "Hike"
 * notes.
 *
 * @param {Request} req  The HTTP request object.
 */
async function validateHike(req) {
  await body('metrics')
    .optional()
    .isArray()
    .withMessage('Metrics must be specified in an array if it is specified at all.')
    .not()
    .custom(arrayHelper.containsDuplicates)
    .withMessage('Duplicate tags are not allowed.')
    .run(req);

  await body('metrics.*.startDate', 'Start date must be a valid date.')
    .optional()
    .trim()
    .isDate()
    .run(req);

  await body('metrics.*.totalTime', 'Total time must be an integer greater than or equal to 0 s.')
    .optional()
    .isInt({ min: 0 })
    .run(req);

  await body('metrics.*.distance', 'Distance must be an integer greater than or equal to 0 km.')
    .optional()
    .isInt({ min: 0 })
    .run(req);

  await body('metrics.*.elevationGain', 'Elevation gain must be a number in metres.')
    .optional()
    .isNumeric()
    .run(req);

  await body('metrics.*.maxElevation', 'Maximum elevation must be a number in metres.')
    .optional()
    .isNumeric()
    .run(req);
}

/**
 * Validates an HTTP request body to ensure it contains a valid new note.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer the next Express middleware
 *                         function that should be called.
 */
async function validateReqBody(req, res, next) {
  await validateBaseNote(req);

  switch (req.body.type) {
    case 'Bike Ride':
      await validateBikeRide(req);
      break;
    case 'Book':
      await validateBook(req);
      break;
    case 'Health':
      // Health notes are base notes for now; there is nothing more to validate
      // for the time being.
      break;
    case 'Hike':
      await validateHike(req);
      break;
    case 'Life':
      // Life notes are my term for base notes -- generic notes or journal
      // entries; there is nothing more to validate.
      break;
    case 'Workout':
      await validateWorkout(req);
      break;
    default:
      return res.status(422).json({
        status: 'error',
        messages: [ `Invalid note type '${req.body.type}'.` ],
        data: req.body,
      });
  }

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

  // @todo: Confirm this: A call to next() is required to process the
  // remaining functions in the array of functions that define exports.create.
  return next();
}

/**
 * Validates the data in the HTTP request body to ensure the new note is
 * valid.  That is, this function confirms that the new note refers to
 * valid/existing objects in the database when it references tags or people,
 * for example.
 *
 * @param {Request}  req   The HTTP request object.
 * @param {Response} res   The HTTP response object.
 * @param {@todo}    next  An implicit pointer to the next Express middleware
 *                         function that should be called.
 *
 * @return {@todo} An HTTP error response or next middleware function.
 */
async function validateReqData(req, res, next) {
  async.parallel({
    type: (callback) => {
      Tag.find({ name: req.body.type }).exec(callback);
    },

    tags: (callback) => {
      Tag.find({ name: { $in: req.body.tags } }).exec(callback);
    },

    workout: (callback) => {
      Tag.find({ name: req.body.workout }).exec(callback);
    },

    people: (callback) => {
      Person.aggregate([
        {
          $addFields: {
            middleNameLength: { $strLenCP: '$middleName' },
          },
        },
        {
          $addFields: {
            middleNameFormatted: {
              $switch: {
                branches: [
                  { case: { $eq: ['$middleNameLength', 0] }, then: ' ' },
                  { case: { $eq: ['$middleNameLength', 1] }, then: { $concat: [' ', '$middleName', '. '] } },
                ],
                default: { $concat: [' ', '$middleName', ' '] },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            preferredName: 1,
            middleName: 1,
            lastName: 1,
            name: { $concat: ['$firstName', '$middleNameFormatted', '$lastName'] },
          },
        },
        {
          $match: {
            name: { $in: req.body.people },
          },
        },
      ]).exec(callback);
    },
  },
  (err, results) => {
    const errors = [];

    if (err) {
      errors.push(err);
    }

    // Check that the user supplied type is a valid tag (i.e., it exists
    // in the tags database collection).
    if (!arrayHelper.areNamesValid(results.type, [req.body.type], true)) {
      errors.push({ error: `Invalid type: ${req.body.type}` });
    }

    // Check that all user supplied tag names are valid (i.e., they exist
    // in the tags database collection).
    console.log(results.tags);
    console.log(req.body.tags);
    if (!arrayHelper.areNamesValid(results.tags, req.body.tags, false)) {
      const invalidTags = arrayHelper.getMissingItems(results.tags, req.body.tags);
      errors.push({ error: `Invalid tag(s): ${invalidTags.join(', ')}` });
    }

    // Check that the user supplied workout is a valid tag (i.e., it exists
    // in the tags database collection).
    if (req.body.type === 'Workout'
      && !arrayHelper.areNamesValid(results.workout, [req.body.workout], false)) {
      errors.push({ error: `Invalid workout: ${req.body.workout}` });
    }

    // Check that the user supplied people names are valid people (i.e.,
    // they exist in the people database collection).
    if (!arrayHelper.areNamesValid(results.people, req.body.people, false)) {
      const invalidPeople = arrayHelper.getMissingItems(results.people, req.body.people);
      errors.push({ error: `Invalid people: ${invalidPeople.join(', ')}` });
    }

    if (errors.length > 0) {
      return res.status(500).json({
        errors,
        data: req.body,
        function: 'validateReqData',
      });
    }

    req.queryResults = results;

    // @todo: Confirm this: A call to next() is required to process the
    // remaining functions in the array of functions that define exports.create.
    return next();
  });
}

/**
 * Validates the parts of an HTTP request body that are specific to "Workout"
 * notes.
 *
 * @param {Request} req  The HTTP request object.
 */
async function validateWorkout(req) {
  await body('workout', 'A workout type is required.')
    .trim()
    .isLength({ min: 1 })
    .run(req);

  await body('metrics.*.property', 'A workout property  is required.')
    .trim()
    .run(req);

  await body('metrics.*.value', 'A value for a workout property is required.')
    .run(req);
}

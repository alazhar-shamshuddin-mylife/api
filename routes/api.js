const express = require('express');

const router = express.Router();

// Require controller modules.
const noteController = require('../controllers/noteController');
const personController = require('../controllers/personController');
const tagController = require('../controllers/tagController');

// Set default API response.
router.get('/', (req, res) => {
  res.json({
    status: 'WORKING',
    message: 'This is the /api/ route!',
  });
});

router.route('/notes/count').get(noteController.count); // Get the total number of notes.
router.route('/notes').post(noteController.create); // Create a note.
router.route('/notes').get(noteController.readAll); // Get a list of notes.
router.route('/notes/:id')
  .get(noteController.read) // Get a specific note.
  .put(noteController.update) // Update a note.
  .delete(noteController.delete); // Delete a note.

router.route('/people/count').get(personController.count); // Get the total number of people.
router.route('/people').post(personController.create); // Create a person.
router.route('/people').get(personController.readAll); // Get a list of people.
router.route('/people/:id')
  .get(personController.read) // Get a specific person.
  .put(personController.update) // Update a person.
  .delete(personController.delete); // Delete a person.

router.route('/tags/count').get(tagController.count); // Get the total number of tags.
router.route('/tags').post(tagController.create); // Create a tag.
router.route('/tags').get(tagController.readAll); // Get a list of tags.
router.route('/tags/:id')
  .get(tagController.read) // Get a specific tag.
  .put(tagController.update) // Update a tag.
  .delete(tagController.delete); // Delete a tag.

module.exports = router;

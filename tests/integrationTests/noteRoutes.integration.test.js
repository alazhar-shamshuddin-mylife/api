/**
 * This file contains integration tests for all REST API routes related
 * to notes (i.e., /api/notes*)
 *
 * @author Alazhar Shamshuddin.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const seedData = require('../testHelpers/seedData');
const Note = require('../../models/note');
const Person = require('../../models/person');
const Tag = require('../../models/tag');

let seededNotes;
let seededPeople;
let seededTags;

beforeAll(async () => {
  const seededData = await seedData.seedData();
  seededNotes = seededData.seededNotes;
  seededPeople = seededData.seededPeople;
  seededTags = seededData.seededTags;
});

/* Note: The mongoose connection is created by the Express app (i.e., by
 * requiring ../../app.js).
 */
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Get the number of existing notes.', () => {});
describe('Get all existing notes.', () => {});
describe('Get an existing note.', () => {});
describe('Get a non-existing note.', () => {});
describe('Update a non-existing note.', () => {});
describe('Delete a non-existing note.', () => {});

describe('Create an invalid, new bike ride note.', () => {});
  // use a valid tag where isTag is false
  // use a tag that does not exist
describe('Create a valid, new bike ride note.', () => {});
describe('Create a duplicate, new bike ride note.', () => {});
describe('Update (put) the bike ride note with valid data.', () => {});
describe('Update (put) the bike ride note with invalid data.', () => {});
describe('Update (put) the bike ride note to make it a duplicate.', () => {});
describe('Delete the bike ride note.', () => {});

describe('Create an invalid, new book note.', () => {});
describe('Create a valid, new book note.', () => {});
describe('Create a duplicate, new book note.', () => {});
describe('Update (put) the book note with valid data.', () => {});
describe('Update (put) the book note with invalid data.', () => {});
describe('Update (put) the book note to make it a duplicate.', () => {});
describe('Delete the book note.', () => {});

describe('Create an invalid, new hike note.', () => {});
describe('Create a valid, new hike note.', () => {});
describe('Create a duplicate, new hike note.', () => {});
describe('Update (put) the hike note with valid data.', () => {});
describe('Update (put) the hike note with invalid data.', () => {});
describe('Update (put) the hike note to make it a duplicate.', () => {});
describe('Delete the hike note.', () => {});

describe('Create an invalid, new health note.', () => {});
describe('Create a valid, new health note.', () => {});
describe('Create a duplicate, new health note.', () => {});
describe('Update (put) the health note with valid data.', () => {});
describe('Update (put) the health note with invalid data.', () => {});
describe('Update (put) the health note to make it a duplicate.', () => {});
describe('Delete the health note.', () => {});

describe('Create an invalid, new life note.', () => {});
describe('Create a valid, new life note.', () => {});
describe('Create a duplicate, new life note.', () => {});
describe('Update (put) the life note with valid data.', () => {});
describe('Update (put) the life note with invalid data.', () => {});
describe('Update (put) the life note to make it a duplicate.', () => {});
describe('Delete the life note.', () => {});

describe('Create an invalid, new workout note.', () => {});
  // use a valid tag where isWorkout is false
  // use a tag that does not exist
describe('Create a valid, new workout note.', () => {});
describe('Create a duplicate, new workout note.', () => {});
describe('Update (put) the workout note with valid data.', () => {});
describe('Update (put) the workout note with invalid data.', () => {});
describe('Update (put) the workout note to make it a duplicate.', () => {});
describe('Delete the workout note.', () => {});

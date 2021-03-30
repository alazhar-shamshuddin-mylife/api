/**
 * This file contains integration tests for all REST API routes related
 * to notes (i.e., /api/notes*)
 *
 * @author Alazhar Shamshuddin.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const seedData = require('../helpers/seedData');
const Note = require('../../models/note');
const Person = require('../../models/person');
const Tag = require('../../models/tag');

const rootUrl = '/api/notes';
let seededNotes;

beforeAll(async () => {
  const seededData = await seedData.seedData();
  seededNotes = seededData.seededNotes;
});

/* Note: The mongoose connection is created by the Express app (i.e., by
 * requiring ../../app.js).
 */
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Get the number of existing notes.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should indicate the number of seeded people.', async () => {
    const numSeededNotes = await Note.countDocuments();
    expect(res.body.data).toBe(numSeededNotes);
  });
});

describe('Get all existing notes.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get(rootUrl);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded people.', async () => {
    const seededNotesSorted = seededNotes.sort((a, b) => (a.name > b.name) - (a.name < b.name));

    seededNotesSorted.forEach((note, index) => {
      expect(res.body.data[index]._id).toBe(note._id.toString());
      // expect(res.body.data[index].firstName).toBe(note.firstName);
      // expect(res.body.data[index].middleName).toBe(note.middleName);
      // expect(res.body.data[index].lastName).toBe(note.lastName);
      // expect(res.body.data[index].preferredName).toBe(note.preferredName);
      // expect(res.body.data[index].googlePhotoUrl).toBe(note.googlePhotoUrl);
      // expect(res.body.data[index].picasaContactId).toBe(note.picasaContactId);
      // expect(JSON.stringify(res.body.data[index].notes)).toBe(JSON.stringify(note.notes));
      // expect(JSON.stringify(res.body.data[index].photos)).toBe(JSON.stringify(note.photos));
      // expect(JSON.stringify(res.body.data[index].birthdate)).toBe(JSON.stringify(note.birthdate));
      expect(JSON.stringify(res.body.data[index].createdAt)).toBe(JSON.stringify(note.createdAt));
      expect(JSON.stringify(res.body.data[index].updatedAt)).toBe(JSON.stringify(note.updatedAt));

      const resBodyTags = res.body.data[index].tags.map((tag) => tag._id);
      expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(note.tags));
    });
  });
});

describe('Get an existing note.', () => { });
describe('Get a non-existing note.', () => { });
describe('Update a non-existing note.', () => { });
describe('Delete a non-existing note.', () => { });

describe('Create an invalid, new bike ride note.', () => { });
// use a valid tag where isTag is false
// use a tag that does not exist
describe('Create a valid, new bike ride note.', () => { });
describe('Create a duplicate, new bike ride note.', () => { });
describe('Update (put) the bike ride note with valid data.', () => { });
describe('Update (put) the bike ride note with invalid data.', () => { });
describe('Update (put) the bike ride note to make it a duplicate.', () => { });
describe('Delete the bike ride note.', () => { });

describe('Create an invalid, new book note.', () => { });
describe('Create a valid, new book note.', () => { });
describe('Create a duplicate, new book note.', () => { });
describe('Update (put) the book note with valid data.', () => { });
describe('Update (put) the book note with invalid data.', () => { });
describe('Update (put) the book note to make it a duplicate.', () => { });
describe('Delete the book note.', () => { });

describe('Create an invalid, new hike note.', () => { });
describe('Create a valid, new hike note.', () => { });
describe('Create a duplicate, new hike note.', () => { });
describe('Update (put) the hike note with valid data.', () => { });
describe('Update (put) the hike note with invalid data.', () => { });
describe('Update (put) the hike note to make it a duplicate.', () => { });
describe('Delete the hike note.', () => { });

describe('Create an invalid, new health note.', () => { });
describe('Create a valid, new health note.', () => { });
describe('Create a duplicate, new health note.', () => { });
describe('Update (put) the health note with valid data.', () => { });
describe('Update (put) the health note with invalid data.', () => { });
describe('Update (put) the health note to make it a duplicate.', () => { });
describe('Delete the health note.', () => { });

describe('Create an invalid, new life note.', () => { });
describe('Create a valid, new life note.', () => { });
describe('Create a duplicate, new life note.', () => { });
describe('Update (put) the life note with valid data.', () => { });
describe('Update (put) the life note with invalid data.', () => { });
describe('Update (put) the life note to make it a duplicate.', () => { });
describe('Delete the life note.', () => { });

describe('Create an invalid, new workout note.', () => { });
// use a valid tag where isWorkout is false
// use a tag that does not exist
describe('Create a valid, new workout note.', () => { });
describe('Create a duplicate, new workout note.', () => { });
describe('Update (put) the workout note with valid data.', () => { });
describe('Update (put) the workout note with invalid data.', () => { });
describe('Update (put) the workout note to make it a duplicate.', () => { });
describe('Delete the workout note.', () => { });

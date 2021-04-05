/**
 * This file contains integration tests for generic REST API routes related
 * to notes (i.e., /api/notes*).  See noteRoutes.*.integration.test.js for
 * note routes that exercise specific types of notes.
 *
 * @author Alazhar Shamshuddin.
 */

const lodash = require('lodash');
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
      expect(res.body.data[index].type._id).toBe(note.type.toString());
      expect(JSON.stringify(res.body.data[index].date)).toBe(JSON.stringify(note.date));
      expect(res.body.data[index].title).toBe(note.title);
      expect(res.body.data[index].description).toBe(note.description);
      expect(res.body.data[index].place).toBe(note.place);
      expect(res.body.data[index].photoAlbum).toBe(note.photoAlbum);
      expect(JSON.stringify(res.body.data[index].createdAt)).toBe(JSON.stringify(note.createdAt));
      expect(JSON.stringify(res.body.data[index].updatedAt)).toBe(JSON.stringify(note.updatedAt));

      const resBodyTags = res.body.data[index].tags.map((tag) => tag._id);
      expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(note.tags));

      const resBodyPeople = res.body.data[index].people.map((person) => person._id);
      expect(JSON.stringify(resBodyPeople)).toBe(JSON.stringify(note.people));
    });
  });
});

describe('Get an existing note.', () => {
  let note;
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    [note] = seededNotes;

    res = await request(app).get(`${rootUrl}/${note._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded note.', async () => {
    expect(res.body.data._id).toBe(note._id.toString());
    expect(res.body.data.type._id).toBe(note.type.toString());
    expect(JSON.stringify(res.body.data.date)).toBe(JSON.stringify(note.date));
    expect(res.body.data.title).toBe(note.title);
    expect(res.body.data.description).toBe(note.description);
    expect(res.body.data.place).toBe(note.place);
    expect(res.body.data.photoAlbum).toBe(note.photoAlbum);
    expect(JSON.stringify(res.body.data.createdAt)).toBe(JSON.stringify(note.createdAt));
    expect(JSON.stringify(res.body.data.updatedAt)).toBe(JSON.stringify(note.updatedAt));

    const resBodyTags = res.body.data.tags.map((tag) => tag._id);
    expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(note.tags));

    const resBodyPeople = res.body.data.people.map((person) => person._id);
    expect(JSON.stringify(resBodyPeople)).toBe(JSON.stringify(note.people));
  });
});

describe('Get a non-existing note.', () => {
  let res;

  test('The HTTP response status and body should indicate error.', async () => {
    res = await request(app).get(`${rootUrl}/${seedData.nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a note with ID '${seedData.nonExistentId}'.`]);
  });

  test('The data in the response body should match the non-existent note ID.', async () => {
    expect(res.body.data).toBe(seedData.nonExistentId);
  });
});

describe('Create a new note with an invalid properties.', () => {
  let res;
  let note;
  let numNotesStart;

  const referenceNote = {
    type: 'Book',
    tags: [],
    date: '2021-04-01',
    title: "Harry Potter and the Sorcerer's Stone",
    description: 'Completed on Thu.Apr.01.2021.',
    people: [],
    place: '',
    authors: ['J. K. Rowling'],
    status: 'Completed',
  };

  test('...missing type.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.type;

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual(["Invalid note type ''."]);
    expect(res.body.data).toStrictEqual({
      type: '',
      tags: [],
      date: '2021-04-01',
      title: "Harry Potter and the Sorcerer's Stone",
      description: 'Completed on Thu.Apr.01.2021.',
      people: [],
      place: '',
      authors: ['J. K. Rowling'],
      status: 'Completed',
    });
  });

  test('...invalid type.', async () => {
    const nonTypeTag = await Tag.findOne({ isType: false, isTag: true }, 'name');

    note = lodash.cloneDeep(referenceNote);
    note.type = nonTypeTag.name;

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid note type '${nonTypeTag.name}'.`]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...missing tags.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.tags;

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      location: 'body',
      msg: 'Tags must be specified in an array; an empty array is okay.',
      param: 'tags',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid tags.', async () => {
    const nonTagTag = await Tag.findOne({ isType: true, isTag: false }, 'name');

    note = lodash.cloneDeep(referenceNote);
    note.tags = [nonTagTag.name];

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid tag(s): '${nonTagTag.name}'.`]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...empty date.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.date = '';

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      location: 'body',
      msg: 'Date must be a valid date.',
      param: 'date',
      value: '',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...empty title.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.title = '';

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      location: 'body',
      msg: 'A title between 1 and 200 characters long is required.',
      param: 'title',
      value: '',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...missing people.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.people;

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      location: 'body',
      msg: 'People must be specified in an array; an empty array is okay.',
      param: 'people',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid people.', async () => {
    const invalidPerson = await Tag.findOne({ isPerson: true }, 'name');
    const validPerson = await Person.findOne({});

    note = lodash.cloneDeep(referenceNote);
    note.people = [invalidPerson.name, validPerson.name];

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid people: '${invalidPerson.name}'.`]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Delete a non-existing note.', () => {
  let res;
  let numNotesStart;

  test('The HTTP response status and body should indicate error.', async () => {
    numNotesStart = await Note.countDocuments();

    res = await request(app).delete(`${rootUrl}/${seedData.nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a note with ID '${seedData.nonExistentId}'.`]);
  });

  test('The data in the response body should match the non-existent note ID.', async () => {
    expect(res.body.data).toBe(seedData.nonExistentId);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

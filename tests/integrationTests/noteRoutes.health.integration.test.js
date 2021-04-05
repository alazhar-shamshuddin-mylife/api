/**
 * This file contains integration tests for all REST API routes related
 * to health notes (i.e., /api/notes*).
 *
 * @author Alazhar Shamshuddin.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const dateHelper = require('../../helpers/dateHelper');
const miscHelper = require('../helpers/miscHelper');
const seedData = require('../helpers/seedData');
const Note = require('../../models/note');
const HealthNote = require('../../models/health');
const Person = require('../../models/person');
const Tag = require('../../models/tag');

const rootUrl = '/api/notes';

beforeAll(async () => {
  await seedData.seedData();
});

/* Note: The mongoose connection is created by the Express app (i.e., by
 * requiring ../../app.js).
 */
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Create a valid, new health note.', () => {
  let res;
  let numNotesStart;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag.name);

    const tmpPeople = await Person.find({ firstName: 'Janet', middleName: 'Mary', lastName: 'Doe' });
    const people = tmpPeople.map((person) => `${person.firstName} ${person.middleName} ${person.lastName}`);

    // @todo: Create functions use tag and people names, not IDs.  This is
    // temporary to note break the migrate scripts.
    note = {
      type: 'Health',
      tags,
      date: '2020-09-12',
      title: 'A Health Note',
      description: 'My description.',
      people,
      place: '',
      photoAlbum: '',
    };

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded note.', async () => {
    expect(res.body.data._id).toBeDefined();
    expect(new Date(res.body.data.date)).toStrictEqual(new Date(note.date));
    expect(res.body.data.title).toBe(note.title);
    expect(res.body.data.description).toBe(note.description);
    expect(res.body.data.place).toBe(note.place);
    expect(res.body.data.photoAlbum).toBe(note.photoAlbum);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(true);
    expect(res.body.data.updatedAt).toBe(res.body.data.createdAt);

    const type = await Tag.findOne({ name: note.type });
    expect(res.body.data.type).toBe(type._id.toString());

    const tags = await Tag.find({ _id: res.body.data.tags });
    const resBodyTags = tags.map((tag) => tag.name);
    expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(note.tags));

    const people = await Person.find({ _id: res.body.data.people });
    const resBodyPeople = people.map((person) => `${person.firstName} ${person.middleName} ${person.lastName}`);
    expect(JSON.stringify(resBodyPeople)).toBe(JSON.stringify(note.people));
  });

  test('The number of notes should increase by one.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart + 1);
  });
});

describe('Create a duplicate, new health note.', () => {
  let res;
  let note;
  let numNotesStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const existingNote = await HealthNote.findOne({});

    note = {
      type: 'Health',
      tags: [],
      date: dateHelper.getDateAsString(existingNote.date),
      title: existingNote.title,
      description: '',
      people: [],
      place: '',
      photoAlbum: '',
    };

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A note with the following date and title already exists: '${note.date}', '${note.title}'.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Update (put) the health note with valid data.', () => {
  let res;
  let numNotesStart;
  let existingNote;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    existingNote = await HealthNote.findOne({});

    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag._id);

    const tmpPeople = await Person.find({}).limit(2);
    const people = tmpPeople.map((person) => person._id);

    note = {
      type: 'Health',
      tags,
      date: '2021-12-31',
      title: 'A Health Note v2',
      description: 'My description v2.',
      people,
      place: 'Vancouver, BC, Canada',
      photoAlbum: '',
    };

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the updated note.', async () => {
    expect(res.body.data._id).toBe(existingNote._id.toString());
    expect(JSON.stringify(res.body.data.tags)).toBe(JSON.stringify(note.tags));
    expect(new Date(res.body.data.date)).toStrictEqual(new Date(note.date));
    expect(res.body.data.title).toBe(note.title);
    expect(res.body.data.description).toBe(note.description);
    expect(JSON.stringify(res.body.data.people)).toBe(JSON.stringify(note.people));
    expect(res.body.data.place).toBe(note.place);
    expect(res.body.data.photoAlbum).toBe(note.photoAlbum);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);

    const type = await Tag.findOne({ name: note.type });
    expect(res.body.data.type).toBe(type._id.toString());
  });

  test('The changes to the updated note persist via a call to GET.', async () => {
    res = await request(app).get(`${rootUrl}/${existingNote._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data._id).toBe(existingNote._id.toString());
    expect(new Date(res.body.data.date)).toStrictEqual(new Date(note.date));
    expect(res.body.data.title).toBe(note.title);
    expect(res.body.data.description).toBe(note.description);
    expect(res.body.data.place).toBe(note.place);
    expect(res.body.data.photoAlbum).toBe(note.photoAlbum);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);

    const type = await Tag.findOne({ name: note.type });
    expect(res.body.data.type._id).toBe(type._id.toString());

    const resBodyTags = res.body.data.tags.map((tag) => tag._id);
    expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(note.tags));

    const resBodyPeople = res.body.data.people.map((person) => person._id);
    expect(JSON.stringify(resBodyPeople)).toBe(JSON.stringify(note.people));
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Delete a health note.', () => {
  let res;
  let numNotesStart;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    note = await HealthNote.findOne({});

    numNotesStart = await Note.countDocuments();

    res = await request(app).delete(`${rootUrl}/${note._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the deleted tag.', async () => {
    expect(res.body.data._id).toBe(note._id.toString());
  });

  test('The number of people should decrease by one.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart - 1);
  });
});

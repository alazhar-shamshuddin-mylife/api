/**
 * This file contains integration tests for all REST API routes related
 * to notes (i.e., /api/notes*)
 *
 * @author Alazhar Shamshuddin.
 */

const lodash = require('lodash');
const mongoose = require('mongoose');
const request = require('supertest');
const util = require('util');
const app = require('../../app');
const dateHelper = require('../../helpers/dateHelper');
const miscHelper = require('../helpers/miscHelper');
const seedData = require('../helpers/seedData');
const Note = require('../../models/note');
const BikeRideNote = require('../../models/bikeRide');
const BookNote = require('../../models/book');
const HealthNote = require('../../models/health');
const LifeNote = require('../../models/life');
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

//------------------------------------------------------------------------------
// Test (Generic) Notes
//------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------
// Test Bike Ride Notes
//------------------------------------------------------------------------------

describe('Create a valid, new bike ride note.', () => {
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
      type: 'Bike Ride',
      tags,
      date: '2020-09-12',
      title: 'A Bike Ride Note',
      description: 'My description.',
      people,
      place: '',
      photoAlbum: '',
      bike: 'MEC National 2018',
      metrics: [
        {
          dataSource: 'Bell F20 Bike Computer',
          startDate: '2020-09-12T13:15-07:00',
          movingTime: 3600,
          totalTime: 5400,
          distance: 30.0,
          avgSpeed: 20.0,
          maxSpeed: 45.0,
          elevationGain: 200,
          maxElevation: 65,
        },
        {
          dataSource: 'Strava',
          startDate: '2020-09-12T13:30-07:00',
          movingTime: 3601,
          totalTime: 5401,
          distance: 30.1,
          avgSpeed: 20.1,
          maxSpeed: 45.1,
          elevationGain: 200.1,
          maxElevation: 65.1,
        },
      ],
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
    expect(res.body.data.bike).toBe(note.bike);
    expect(miscHelper.areBikeRideMetricsEqual(res.body.data.metrics, note.metrics)).toBe(true);
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

describe('Create a duplicate, new bike ride note.', () => {
  let res;
  let note;
  let numNotesStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const existingNote = await BikeRideNote.findOne({});

    note = {
      type: 'Bike Ride',
      tags: [],
      date: dateHelper.getDateAsString(existingNote.date),
      title: existingNote.title,
      description: 'My description.',
      people: [],
      place: '',
      photoAlbum: '',
      bike: existingNote.bike,
      metrics: [{
        dataSource: 'Bell F20 Bike Computer',
        movingTime: 3600,
        distance: 30.0,
        avgSpeed: 20.0,
        maxSpeed: 45.0,
      }],
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

describe('Create an invalid, new bike ride note.', () => {
  let res;
  let note;
  let numNotesStart;

  const referenceNote = {
    type: 'Bike Ride',
    tags: [],
    date: '2020-09-12',
    title: 'A Bike Ride Note',
    description: 'My description.',
    people: [],
    place: '',
    photoAlbum: '',
    bike: 'MEC National 2018',
    metrics: [],
  };

  test('...missing bike.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.bike;

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'Bike must be one of: MEC National 2018.',
      param: 'bike',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual({
      type: 'Bike Ride',
      tags: [],
      date: '2020-09-12',
      title: 'A Bike Ride Note',
      description: 'My description.',
      people: [],
      place: '',
      photoAlbum: '',
      bike: '',
      metrics: [],
    });
  });

  test('...invalid bike.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.bike = 'Does Not Exist';

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.bike,
      msg: 'Bike must be one of: MEC National 2018.',
      param: 'bike',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...non-array metrics.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.metrics = '';

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'Metrics must be specified in an array if it is specified at all.',
      param: 'metrics',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...duplicate metric sets.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      dataSource: 'Bell F20 Bike Computer',
      startDate: '2020-09-12T13:15-07:00',
      movingTime: 3600,
      totalTime: 5400,
      distance: 30.0,
      avgSpeed: 20.0,
      maxSpeed: 45.0,
      elevationGain: 200,
      maxElevation: 65,
    };

    note.metrics.push(metrics);
    note.metrics.push(metrics);

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics,
      msg: 'Duplicate metric sets are not allowed.',
      param: 'metrics',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid metric data source.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      dataSource: 'Does Not Exist',
    };

    note.metrics.push(metrics);

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics[0].dataSource,
      msg: 'Data source must be one of: Bell F20 Bike Computer, Strava.',
      param: 'metrics[0].dataSource',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...negative metrics.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      movingTime: -0.1,
      totalTime: -1,
      distance: -25.0,
      avgSpeed: -99,
      maxSpeed: -99.99,
      elevationGain: -1,
      maxElevation: -0.0001,
    };

    note.metrics.push(metrics);

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: -0.1,
        msg: 'Moving time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].movingTime',
        location: 'body',
      },
      {
        value: -1,
        msg: 'Total time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].totalTime',
        location: 'body',
      },
      {
        value: -25,
        msg: 'Distance must be an integer greater than or equal to 0 km.',
        param: 'metrics[0].distance',
        location: 'body',
      },
    ]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid metric start date.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      startDate: '2021-02-30Z06:45-08:00',
    };

    note.metrics.push(metrics);

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics[0].startDate,
      msg: 'Start date must be a valid ISO 8601 date/time.',
      param: 'metrics[0].startDate',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Update (put) the bike ride note with valid data.', () => {
  let res;
  let numNotesStart;
  let existingNote;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    existingNote = await BikeRideNote.findOne({});

    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag._id);

    const tmpPeople = await Person.find({}).limit(2);
    const people = tmpPeople.map((person) => person._id);

    note = {
      type: 'Bike Ride',
      tags,
      date: '2021-12-31',
      title: 'A Bike Ride Note v2',
      description: 'My description v2.',
      people,
      place: 'Vancouver, BC, Canada',
      photoAlbum: '',
      bike: existingNote.bike,
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

describe('Update (put) the bike ride note to make it a duplicate.', () => {
  let res;
  let note;
  let numNotesStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const tmpNotes = await Note.find({}).limit(2);
    const [existingNote1, existingNote2] = tmpNotes;

    note = {
      _id: existingNote1._id,
      type: 'Bike Ride',
      tags: [],
      date: dateHelper.getDateAsString(existingNote2.date),
      title: existingNote2.title,
      description: '',
      people: [],
      place: '',
      photoAlbum: '',
      bike: 'MEC National 2018',
    };

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${note._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A note with the following date and title already exists: '${note.date}', '${note.title}'.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(JSON.stringify(res.body.data)).toStrictEqual(JSON.stringify(note));
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Update (put) the bike ride note with invalid data.', () => {
  let res;
  let note;
  let existingNote;
  let numNotesStart;

  const referenceNote = {
    type: 'Bike Ride',
    tags: [],
    date: '2020-09-12',
    title: 'A Bike Ride Note',
    description: 'My description.',
    people: [],
    place: '',
    photoAlbum: '',
    bike: 'MEC National 2018',
    metrics: [],
  };

  test('...missing bike.', async () => {
    note = lodash.cloneDeep(referenceNote);
    existingNote = await BikeRideNote.findOne({});

    delete note.bike;

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'Bike must be one of: MEC National 2018.',
      param: 'bike',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual({
      type: 'Bike Ride',
      tags: [],
      date: '2020-09-12',
      title: 'A Bike Ride Note',
      description: 'My description.',
      people: [],
      place: '',
      photoAlbum: '',
      bike: '',
      metrics: [],
    });
  });

  test('...invalid bike.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.bike = 'Does Not Exist';

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.bike,
      msg: 'Bike must be one of: MEC National 2018.',
      param: 'bike',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...non-array metrics.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.metrics = '';

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'Metrics must be specified in an array if it is specified at all.',
      param: 'metrics',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...duplicate metric sets.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      dataSource: 'Bell F20 Bike Computer',
      startDate: '2020-09-12T13:15-07:00',
      movingTime: 3600,
      totalTime: 5400,
      distance: 30.0,
      avgSpeed: 20.0,
      maxSpeed: 45.0,
      elevationGain: 200,
      maxElevation: 65,
    };

    note.metrics.push(metrics);
    note.metrics.push(metrics);

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics,
      msg: 'Duplicate metric sets are not allowed.',
      param: 'metrics',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid metric data source.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      dataSource: 'Does Not Exist',
    };

    note.metrics.push(metrics);

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics[0].dataSource,
      msg: 'Data source must be one of: Bell F20 Bike Computer, Strava.',
      param: 'metrics[0].dataSource',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...negative metrics.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      movingTime: -0.1,
      totalTime: -1,
      distance: -25.0,
      avgSpeed: -99,
      maxSpeed: -99.99,
      elevationGain: -1,
      maxElevation: -0.0001,
    };

    note.metrics.push(metrics);

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: -0.1,
        msg: 'Moving time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].movingTime',
        location: 'body',
      },
      {
        value: -1,
        msg: 'Total time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].totalTime',
        location: 'body',
      },
      {
        value: -25,
        msg: 'Distance must be an integer greater than or equal to 0 km.',
        param: 'metrics[0].distance',
        location: 'body',
      },
    ]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid metric start date.', async () => {
    note = lodash.cloneDeep(referenceNote);

    const metrics = {
      startDate: '2021-02-30Z06:45-08:00',
    };

    note.metrics.push(metrics);

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics[0].startDate,
      msg: 'Start date must be a valid ISO 8601 date/time.',
      param: 'metrics[0].startDate',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Delete the bike ride note.', () => {
  let res;
  let numNotesStart;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    note = await BikeRideNote.findOne({});

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

//------------------------------------------------------------------------------
// Test Book Notes
//------------------------------------------------------------------------------

describe('Create a valid, new book note.', () => {
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
      type: 'Book',
      tags,
      date: '2020-09-13',
      title: "1984 meets The Handmaid's Tale",
      description: 'This would be a good book, if not completely depressing.',
      people,
      place: 'Vancouver, BC, Canada',
      authors: ['George Orwell', 'Margaret Atwood'],
      format: 'Audiobook',
      status: 'Completed',
      rating: 9,
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
    expect(res.body.data.authors).toStrictEqual(note.authors);
    expect(res.body.data.format).toBe(note.format);
    expect(res.body.data.status).toBe(note.status);
    expect(res.body.data.rating).toBe(note.rating);
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

describe('Create a duplicate, new book note.', () => {
  let res;
  let note;
  let numNotesStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const existingNote = await BookNote.findOne({});

    note = {
      type: 'Book',
      tags: [],
      date: dateHelper.getDateAsString(existingNote.date),
      title: existingNote.title,
      description: 'My description.',
      people: [],
      place: '',
      photoAlbum: '',
      authors: ['George Orwell'],
      status: 'Abandoned',
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

describe('Create an invalid, new book note.', () => {
  let res;
  let note;
  let numNotesStart;

  const referenceNote = {
    type: 'Book',
    tags: [],
    date: '2020-09-13',
    title: "The Handmaid's Tale",
    description: '',
    people: [],
    place: 'Vancouver, BC, Canada',
    authors: ['Margaret Atwood'],
    format: 'Audiobook',
    status: 'Completed',
    rating: 9,
  };

  test('...missing authors array.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.authors;

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        msg: 'Authors must be specified in an array.',
        param: 'authors',
        location: 'body',
      },
      {
        msg: 'At least one author is required.',
        param: 'authors',
        location: 'body',
      },
    ]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...empty authors array.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.authors = [];

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: [],
      msg: 'At least one author is required.',
      param: 'authors',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...duplicate authors.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.authors = ['George Orwell', 'George Orwell'];

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.authors,
      msg: 'Duplicate authors are not allowed.',
      param: 'authors',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...authors as a string.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.authors = 'George Orwell';

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.authors,
      msg: 'Authors must be specified in an array.',
      param: 'authors',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid format.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.format = 'Bad Format';

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.format,
      msg: 'Format must be one of: Book, eBook, Audiobook.',
      param: 'format',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...missing status.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.status;

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'Status must be one of: Completed, Abandoned.',
      param: 'status',
      location: 'body',
    }]);

    note.status = '';
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid status.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.status = 'Bad Status';

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.status,
      msg: 'Status must be one of: Completed, Abandoned.',
      param: 'status',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid fractional rating.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.rating = 7.5;

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.rating,
      msg: 'Rating must be an integer between 1 and 10.',
      param: 'rating',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid negative rating.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.rating = -7;

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.rating,
      msg: 'Rating must be an integer between 1 and 10.',
      param: 'rating',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Update (put) the book note with valid data.', () => {
  let res;
  let numNotesStart;
  let existingNote;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    existingNote = await BookNote.findOne({});

    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag._id);

    const tmpPeople = await Person.find({}).limit(2);
    const people = tmpPeople.map((person) => person._id);

    note = {
      type: 'Book',
      tags,
      date: '2020-09-13',
      title: "The Handmaid's Tale",
      description: '',
      people,
      place: 'Vancouver, BC, Canada',
      authors: ['Margaret Atwood'],
      format: 'Audiobook',
      status: 'Completed',
      rating: 9,
    };

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the updated note.', async () => {
    expect(res.body.data._id).toBe(existingNote._id.toString());
    expect(new Date(res.body.data.date)).toStrictEqual(new Date(note.date));
    expect(res.body.data.title).toBe(note.title);
    expect(res.body.data.description).toBe(note.description);
    expect(res.body.data.place).toBe(note.place);
    expect(res.body.data.photoAlbum).toBe(note.photoAlbum);
    expect(res.body.data.authors).toStrictEqual(note.authors);
    expect(res.body.data.format).toBe(note.format);
    expect(res.body.data.status).toBe(note.status);
    expect(res.body.data.rating).toBe(note.rating);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);

    const type = await Tag.findOne({ name: note.type });
    expect(res.body.data.type).toBe(type._id.toString());

    const tags = await Tag.find({ _id: res.body.data.tags });
    const resBodyTags = tags.map((tag) => tag._id);
    expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(note.tags));

    const people = await Person.find({ _id: res.body.data.people });
    const resBodyPeople = people.map((person) => person._id);
    expect(JSON.stringify(resBodyPeople)).toBe(JSON.stringify(note.people));
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
    expect(res.body.data.authors).toStrictEqual(note.authors);
    expect(res.body.data.format).toBe(note.format);
    expect(res.body.data.status).toBe(note.status);
    expect(res.body.data.rating).toBe(note.rating);
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

describe('Update (put) the book note to make it a duplicate.', () => {
  let res;
  let note;
  let numNotesStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const tmpNotes = await Note.find({}).limit(2);
    const [existingNote1, existingNote2] = tmpNotes;

    note = {
      _id: existingNote1._id,
      type: 'Book',
      tags: [],
      date: dateHelper.getDateAsString(existingNote2.date),
      title: existingNote2.title,
      description: '',
      people: [],
      place: '',
      authors: ['George Orwell', 'Margaret Atwood'],
      format: 'Audiobook',
      status: 'Completed',
      rating: 9,
    };

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${note._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A note with the following date and title already exists: '${note.date}', '${note.title}'.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(JSON.stringify(res.body.data)).toStrictEqual(JSON.stringify(note));
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Update (put) the book note with invalid data.', () => {
  let res;
  let note;
  let existingNote;
  let numNotesStart;

  const referenceNote = {
    type: 'Book',
    tags: [],
    date: '2020-09-13',
    title: "The Handmaid's Tale",
    description: '',
    people: [],
    place: 'Vancouver, BC, Canada',
    authors: ['Margaret Atwood'],
    format: 'Audiobook',
    status: 'Completed',
    rating: 9,
  };

  test('...missing authors array.', async () => {
    note = lodash.cloneDeep(referenceNote);
    existingNote = await BookNote.findOne({});

    delete note.authors;

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        msg: 'Authors must be specified in an array.',
        param: 'authors',
        location: 'body',
      },
      {
        msg: 'At least one author is required.',
        param: 'authors',
        location: 'body',
      },
    ]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...empty authors array.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.authors = [];

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: [],
      msg: 'At least one author is required.',
      param: 'authors',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...duplicate authors.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.authors = ['George Orwell', 'George Orwell'];

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.authors,
      msg: 'Duplicate authors are not allowed.',
      param: 'authors',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...authors as a string.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.authors = 'George Orwell';

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.authors,
      msg: 'Authors must be specified in an array.',
      param: 'authors',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid format.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.format = 'Bad Format';

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.format,
      msg: 'Format must be one of: Book, eBook, Audiobook.',
      param: 'format',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...missing status.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.status;

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'Status must be one of: Completed, Abandoned.',
      param: 'status',
      location: 'body',
    }]);

    note.status = '';
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid status.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.status = 'Bad Status';

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.status,
      msg: 'Status must be one of: Completed, Abandoned.',
      param: 'status',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid fractional rating.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.rating = 7.5;

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.rating,
      msg: 'Rating must be an integer between 1 and 10.',
      param: 'rating',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid negative rating.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.rating = -7;

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.rating,
      msg: 'Rating must be an integer between 1 and 10.',
      param: 'rating',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Delete the book note.', () => {
  let res;
  let numNotesStart;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    note = await BookNote.findOne({});

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

//------------------------------------------------------------------------------
// Test Hike Notes
//------------------------------------------------------------------------------

describe('Create a valid, new hike note.', () => { });
describe('Create a duplicate, new hike note.', () => { });
describe('Create an invalid, new hike note.', () => { });
describe('Update (put) the hike note with valid data.', () => { });
describe('Update (put) the hike note to make it a duplicate.', () => { });
describe('Update (put) the hike note with invalid data.', () => { });
describe('Delete the hike note.', () => { });

//------------------------------------------------------------------------------
// Test Health Notes
//------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------
// Test Life Notes
//------------------------------------------------------------------------------

describe('Create a valid, new life note.', () => {
  let res;
  let numNotesStart;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag.name);

    const tmpPeople = await Person.find({ firstName: 'Janet', middleName: 'Mary', lastName: 'Doe'});
    const people = tmpPeople.map((person) => `${person.firstName} ${person.middleName} ${person.lastName}`);

    // @todo: Create functions use tag and people names, not IDs.  This is
    // temporary to note break the migrate scripts.
    note = {
      type: 'Life',
      tags,
      date: '2020-09-12',
      title: 'A Life Note',
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

describe('Create a duplicate, new life note.', () => {
  let res;
  let note;
  let numNotesStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const existingNote = await LifeNote.findOne({});

    note = {
      type: 'Life',
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

describe('Update (put) the life note with valid data.', () => {
  let res;
  let numNotesStart;
  let existingNote;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    existingNote = await LifeNote.findOne({});

    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag._id);

    const tmpPeople = await Person.find({}).limit(2);
    const people = tmpPeople.map((person) => person._id);

    note = {
      type: 'Life',
      tags,
      date: '2021-12-31',
      title: 'A Life Note v2',
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

describe('Delete a life note.', () => {
  let res;
  let numNotesStart;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    note = await LifeNote.findOne({});

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

//------------------------------------------------------------------------------
// Test Workout Notes
//------------------------------------------------------------------------------

describe('Create a valid, new workout note.', () => { });
describe('Create a duplicate, new workout note.', () => { });
describe('Create an invalid, new workout note.', () => { });
// use a valid tag where isWorkout is false
// use a tag that does not exist
describe('Update (put) the workout note with valid data.', () => { });
describe('Update (put) the workout note to make it a duplicate.', () => { });
describe('Update (put) the workout note with invalid data.', () => { });
describe('Delete the workout note.', () => { });

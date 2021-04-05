/**
 * This file contains integration tests for all REST API routes related
 * to bike ride notes (i.e., /api/notes*).
 *
 * @author Alazhar Shamshuddin.
 */

const lodash = require('lodash');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const dateHelper = require('../../helpers/dateHelper');
const miscHelper = require('../helpers/miscHelper');
const seedData = require('../helpers/seedData');
const Note = require('../../models/note');
const BikeRideNote = require('../../models/bikeRide');
const Person = require('../../models/person');
const Tag = require('../../models/tag');

const rootUrl = '/api/notes';
let seededNotes;

beforeAll(async () => {
  await seedData.seedData();
});

/* Note: The mongoose connection is created by the Express app (i.e., by
 * requiring ../../app.js).
 */
afterAll(async () => {
  await mongoose.connection.close();
});

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
    expect(miscHelper.areMetricsEqual(res.body.data.metrics, note.metrics)).toBe(true);
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
        value: note.metrics[0].movingTime,
        msg: 'Moving time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].movingTime',
        location: 'body',
      },
      {
        value: note.metrics[0].totalTime,
        msg: 'Total time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].totalTime',
        location: 'body',
      },
      {
        value: note.metrics[0].distance,
        msg: 'Distance must be an integer greater than or equal to 0 km.',
        param: 'metrics[0].distance',
        location: 'body',
      },
      {
        value: note.metrics[0].avgSpeed,
        msg: 'Average speed must be greater than or equal to 0 km/h.',
        param: 'metrics[0].avgSpeed',
        location: 'body',
      },
      {
        value: note.metrics[0].maxSpeed,
        msg: 'Maximum speed must be greater than or equal to 0 km/h.',
        param: 'metrics[0].maxSpeed',
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
    expect(res.body.data.bike).toBe(note.bike);
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
    expect(res.body.data.bike).toBe(note.bike);
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
        value: note.metrics[0].movingTime,
        msg: 'Moving time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].movingTime',
        location: 'body',
      },
      {
        value: note.metrics[0].totalTime,
        msg: 'Total time must be an integer greater than or equal to 0 s.',
        param: 'metrics[0].totalTime',
        location: 'body',
      },
      {
        value: note.metrics[0].distance,
        msg: 'Distance must be an integer greater than or equal to 0 km.',
        param: 'metrics[0].distance',
        location: 'body',
      },
      {
        value: note.metrics[0].avgSpeed,
        msg: 'Average speed must be greater than or equal to 0 km/h.',
        param: 'metrics[0].avgSpeed',
        location: 'body',
      },
      {
        value: note.metrics[0].maxSpeed,
        msg: 'Maximum speed must be greater than or equal to 0 km/h.',
        param: 'metrics[0].maxSpeed',
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

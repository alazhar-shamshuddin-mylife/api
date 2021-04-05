/**
 * This file contains integration tests for all REST API routes related
 * to workout notes (i.e., /api/notes*).
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
const WorkoutNote = require('../../models/workout');
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

describe('Create a valid, new workout note.', () => {
  let res;
  let numNotesStart;
  let note;
  let workoutTag;

  test('The HTTP response status and body should indicate success.', async () => {
    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag.name);

    const tmpPeople = await Person.find({ firstName: 'Janet', middleName: 'Mary', lastName: 'Doe' });
    const people = tmpPeople.map((person) => `${person.firstName} ${person.middleName} ${person.lastName}`);

    workoutTag = await Tag.findOne({ isWorkout: true });

    // @todo: Create functions use tag and people names, not IDs.  This is
    // temporary to note break the migrate scripts.
    note = {
      type: 'Workout',
      tags,
      date: '2020-09-13',
      title: 'An Evening Run',
      description: 'A refreshing run.',
      people,
      place: 'Vancouver, BC, Canada',
      photoAlbum: '',
      workout: workoutTag.name,
      metrics: [
        { property: 'totalTime', value: 3600 },
        { property: 'elevationGain', value: 1100 },
        { property: 'cost', value: 5.00 },
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
    expect(res.body.data.workout).toStrictEqual(workoutTag._id.toString());
    expect(miscHelper.areWorkoutMetricsEqual(res.body.data.metrics, note.metrics)).toBe(true);
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

describe('Create a duplicate, new workout note.', () => {
  let res;
  let note;
  let numNotesStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const existingNote = await WorkoutNote.findOne({});

    note = {
      type: 'Workout',
      tags: [],
      date: dateHelper.getDateAsString(existingNote.date),
      title: existingNote.title,
      description: 'My description.',
      people: [],
      place: '',
      photoAlbum: '',
      workout: existingNote.workout.toString(),
      metrics: [
        { property: 'totalTime', value: 3600 },
        { property: 'elevationGain', value: 1100 },
        { property: 'cost', value: 5.00 },
      ],
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

// use a valid tag where isWorkout is false
// use a tag that does not exist

describe('Create an invalid, new workout note.', () => {
  let res;
  let note;
  let numNotesStart;
  let workoutTag;

  const referenceNote = {
    type: 'Workout',
    tags: [],
    date: '2020-09-13',
    title: 'Another Evening Run',
    description: 'A refreshing run.',
    people: [],
    place: 'Vancouver, BC, Canada',
    photoAlbum: '',
    workout: 'Grouse Grind',
    metrics: [
      { property: 'totalTime', value: 3600 },
      { property: 'elevationGain', value: 1100 },
      { property: 'cost', value: 5.00 },
    ],
  };

  test('...missing workout tag.', async () => {
    note = lodash.cloneDeep(referenceNote);
    delete note.workout;

    numNotesStart = await Note.countDocuments();

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'A workout type is required.',
      param: 'workout',
      location: 'body',
    }]);

    note.workout = '';
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid workout tag.', async () => {
    note = lodash.cloneDeep(referenceNote);
    workoutTag = await Tag.findOne({ isWorkout: false });
    note.workout = workoutTag.name;

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid workout: '${note.workout}'.`]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...non-array metrics.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.metrics = 'Bad metrics data';

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics,
      msg: 'Metrics must be specified in an array if it is specified at all.',
      param: 'metrics',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...duplicate metric sets.', async () => {
    note = lodash.cloneDeep(referenceNote);

    note.metrics = [
      { property: 'totalTime', value: 3600 },
      { property: 'elevationGain', value: 1100 },
      { property: 'cost', value: 5.00 },
      { property: 'cost', value: 5.00 },
    ];

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

  test('...invalid/missing metric properties/values.', async () => {
    note = lodash.cloneDeep(referenceNote);

    note.metrics = [
      { property: 'property0', value: 3600 },
      { property: 'property1', value: false },
      { property: 'property2', value: '' },
      { property: '3' },
      { property: '', value: 'value4' },
      { property: false, value: 'value5' },
      { property6: 'badProperty6', value6: 'badValue6' },
    ];

    res = await request(app).post(rootUrl).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: '',
        msg: 'Property is required.',
        param: 'metrics[4].property',
        location: 'body',
      },
      {
        value: '',
        msg: 'Property is required.',
        param: 'metrics[6].property',
        location: 'body',
      },
      {
        value: '',
        msg: 'Value is required.',
        param: 'metrics[2].value',
        location: 'body',
      },
      {
        msg: 'Value is required.',
        param: 'metrics[3].value',
        location: 'body',
      },
      {
        msg: 'Value is required.',
        param: 'metrics[6].value',
        location: 'body',
      },
    ]);

    note.metrics = [
      { property: 'property0', value: 3600 },
      { property: 'property1', value: false },
      { property: 'property2', value: '' },
      { property: '3' },
      { property: '', value: 'value4' },
      { property: 'false', value: 'value5' },
      { property: '', property6: 'badProperty6', value6: 'badValue6' },
    ];
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Update (put) the workout note with valid data.', () => {
  let res;
  let numNotesStart;
  let existingNote;
  let note;
  let workoutTag;

  test('The HTTP response status and body should indicate success.', async () => {
    existingNote = await WorkoutNote.findOne({});

    const tmpTags = await Tag.find({ isTag: true }).limit(2);
    const tags = tmpTags.map((tag) => tag._id);

    const tmpPeople = await Person.find({}).limit(2);
    const people = tmpPeople.map((person) => person._id);

    workoutTag = await Tag.findOne({ isWorkout: true });

    note = {
      type: 'Workout',
      tags,
      date: '2020-09-13',
      title: 'Another Evening Run',
      description: 'A refreshing run.',
      people,
      place: 'Vancouver, BC, Canada',
      photoAlbum: '',
      workout: workoutTag._id,
      metrics: [],
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
    expect(res.body.data.workout).toStrictEqual(workoutTag._id.toString());
    expect(miscHelper.areWorkoutMetricsEqual(res.body.data.metrics, note.metrics)).toBe(true);
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
    expect(res.body.data.workout).toStrictEqual(workoutTag._id.toString());
    expect(miscHelper.areWorkoutMetricsEqual(res.body.data.metrics, note.metrics)).toBe(true);
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

describe('Update (put) the workout note to make it a duplicate.', () => {
  let res;
  let note;
  let numNotesStart;
  let workoutTag;

  test('The HTTP response status and body should indicate failure.', async () => {
    const tmpNotes = await Note.find({}).limit(2);
    const [existingNote1, existingNote2] = tmpNotes;

    workoutTag = await Tag.findOne({ isWorkout: true });

    note = {
      _id: existingNote1._id,
      type: 'Workout',
      tags: [],
      date: dateHelper.getDateAsString(existingNote2.date),
      title: existingNote2.title,
      description: '',
      people: [],
      place: '',
      photoAlbum: '',
      workout: workoutTag._id,
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

describe('Update (put) the workout note with invalid data.', () => {
  let res;
  let note;
  let existingNote;
  let numNotesStart;
  let workoutTag;

  const referenceNote = {
    type: 'Workout',
    tags: [],
    date: '2020-09-13',
    title: 'Another Evening Run',
    description: 'A refreshing run.',
    people: [],
    place: 'Vancouver, BC, Canada',
    photoAlbum: '',
    workout: 'Grouse Grind',
    metrics: [
      { property: 'totalTime', value: 3600 },
      { property: 'elevationGain', value: 1100 },
      { property: 'cost', value: 5.00 },
    ],
  };

  test('...missing workout tag.', async () => {
    note = lodash.cloneDeep(referenceNote);
    existingNote = await WorkoutNote.findOne({});

    delete note.workout;

    numNotesStart = await Note.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: '',
      msg: 'A workout type is required.',
      param: 'workout',
      location: 'body',
    }]);

    note.workout = '';
    expect(res.body.data).toStrictEqual(note);
  });

  test('...invalid workout tag.', async () => {
    note = lodash.cloneDeep(referenceNote);
    workoutTag = await Tag.findOne({ isWorkout: false });
    note.workout = workoutTag._id;

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid workout: '${note.workout}'.`]);
    expect(JSON.stringify(res.body.data)).toStrictEqual(JSON.stringify(note));
  });

  test('...non-array metrics.', async () => {
    note = lodash.cloneDeep(referenceNote);
    note.metrics = 'Bad metrics data';

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      value: note.metrics,
      msg: 'Metrics must be specified in an array if it is specified at all.',
      param: 'metrics',
      location: 'body',
    }]);
    expect(res.body.data).toStrictEqual(note);
  });

  test('...duplicate metric sets.', async () => {
    note = lodash.cloneDeep(referenceNote);

    note.metrics = [
      { property: 'totalTime', value: 3600 },
      { property: 'elevationGain', value: 1100 },
      { property: 'cost', value: 5.00 },
      { property: 'cost', value: 5.00 },
    ];

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

  test('...invalid/missing metric properties/values.', async () => {
    note = lodash.cloneDeep(referenceNote);

    note.metrics = [
      { property: 'property0', value: 3600 },
      { property: 'property1', value: false },
      { property: 'property2', value: '' },
      { property: '3' },
      { property: '', value: 'value4' },
      { property: false, value: 'value5' },
      { property6: 'badProperty6', value6: 'badValue6' },
    ];

    res = await request(app).put(`${rootUrl}/${existingNote._id}`).send(note);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: '',
        msg: 'Property is required.',
        param: 'metrics[4].property',
        location: 'body',
      },
      {
        value: '',
        msg: 'Property is required.',
        param: 'metrics[6].property',
        location: 'body',
      },
      {
        value: '',
        msg: 'Value is required.',
        param: 'metrics[2].value',
        location: 'body',
      },
      {
        msg: 'Value is required.',
        param: 'metrics[3].value',
        location: 'body',
      },
      {
        msg: 'Value is required.',
        param: 'metrics[6].value',
        location: 'body',
      },
    ]);

    note.metrics = [
      { property: 'property0', value: 3600 },
      { property: 'property1', value: false },
      { property: 'property2', value: '' },
      { property: '3' },
      { property: '', value: 'value4' },
      { property: 'false', value: 'value5' },
      { property: '', property6: 'badProperty6', value6: 'badValue6' },
    ];
    expect(res.body.data).toStrictEqual(note);
  });

  test('The number of notes should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numNotesStart);
  });
});

describe('Delete the workout note.', () => {
  let res;
  let numNotesStart;
  let note;

  test('The HTTP response status and body should indicate success.', async () => {
    note = await WorkoutNote.findOne({});

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

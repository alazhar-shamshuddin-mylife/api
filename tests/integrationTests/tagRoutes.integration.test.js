/**
 * This file contains integration tests for all REST API routes related
 * to tags (i.e., /api/tags*)
 *
 * @author Alazhar Shamshuddin.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const seedData = require('../testHelpers/seedData');
const Tag = require('../../models/tag');

let seededTags;

beforeAll(async () => {
  seededTags = await Tag.insertMany(seedData.tags);
});

/* Note: The mongoose connection is created by the Express app (i.e., by
 * requiring ../../app.js).
 */
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Get the number of tags.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should indicate the number of seeded tags.', async () => {
    const numSeededTags = await Tag.countDocuments();
    expect(res.body.data).toBe(numSeededTags);
  });
});

describe('Get all existing tags.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get('/api/tags');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded tags.', async () => {
    const seededTagsSorted = seededTags.sort((a, b) => (a.name > b.name) - (a.name < b.name));
    seededTagsSorted.forEach((tag, index) => {
      // expect(tag._id).toBe(res.body.data[index]._id);
      expect(tag.name).toBe(res.body.data[index].name);
      expect(tag.isType).toBe(res.body.data[index].isType);
      expect(tag.isTag).toBe(res.body.data[index].isTag);
      expect(tag.isWorkout).toBe(res.body.data[index].isWorkout);
      expect(tag.isPerson).toBe(res.body.data[index].isPerson);
      expect(tag.description).toBe(res.body.data[index].description);
      // expect(tag.createdAt).toBe(res.body.data[index].createdAt);
      // expect(tag.updatedAt).toBe(res.body.data[index].updatedAt);
    });
  });
});

describe('Get an existing tag.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get(`/api/tags/${seededTags[0].id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded tag.', async () => {
    // console.log(seededTags[0]);
    // console.log(res.body.data);
    // expect(seededTags[0]._id).toBe(res.body.data._id);
    expect(seededTags[0].name).toBe(res.body.data.name);
    expect(seededTags[0].isType).toBe(res.body.data.isType);
    expect(seededTags[0].isTag).toBe(res.body.data.isTag);
    expect(seededTags[0].isWorkout).toBe(res.body.data.isWorkout);
    expect(seededTags[0].isPerson).toBe(res.body.data.isPerson);
    expect(seededTags[0].description).toBe(res.body.data.description);
    // expect(seededTags[0].createdAt).toBe(res.body.data.createdAt);
    // expect(seededTags[0].updatedAt).toBe(res.body.data.updatedAt);
  });
});

describe('Get a non-existing tag.', () => {
  test('The HTTP response status and body should indicate error.', async () => {
    const nonExistentTagId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    const res = await request(app).get(`/api/tags/${nonExistentTagId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a note with ID '${nonExistentTagId}'.`]);
    expect(res.body.data).toBe(nonExistentTagId);
  });
});

describe('Create a valid, new tag.', () => {
  const newTag = {
    name: 'Travelling',
    isType: false,
    isTag: true,
    isWorkout: false,
    isPerson: false,
    description: 'A tag for my out-of-province trips.',
  };

  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app)
      .post('/api/tags')
      .send(newTag);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the new tag.', async () => {
    expect(newTag.name).toBe(res.body.data.name);
    expect(newTag.isType).toBe(res.body.data.isType);
    expect(newTag.isTag).toBe(res.body.data.isTag);
    expect(newTag.isWorkout).toBe(res.body.data.isWorkout);
    expect(newTag.isPerson).toBe(res.body.data.isPerson);
    expect(newTag.description).toBe(res.body.data.description);
  });
});

describe('Create invalid, new tags.', () => {
  let res;

  test('Cannot create a tag with a duplicate name.', async () => {
    const newTag = {
      name: 'Travelling',
      isType: false,
      isTag: true,
      isWorkout: false,
      isPerson: false,
      description: 'A tag for my out-of-province trips.',
    };

    res = await request(app)
      .post('/api/tags')
      .send(newTag);
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual(["A tag called 'Travelling' already exists."]);
    expect(res.body.function).toBe('validateReqDataForCreate');
    //expect(res.body.data).toBe((newTag);
    //console.log(res.body);
  });

  test('Cannot create a tag with missing fields', async () => {
    const newTag = {
      name: 'Travelling',
      isType: '',
      isTag: 0,
      isWorkout: null,
      isPerson: undefined,
    };

    res = await request(app)
      .post('/api/tags')
      .send(newTag);
    //console.log(res.body);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        msg: 'Description is required but it can be an empty string.',
        param: 'description',
        location: 'body',
      },
      {
        value: '',
        msg: 'IsType is required and it must be either true or false.',
        param: 'isType',
        location: 'body',
      },
      {
        value: '',
        msg: 'IsWorkout is required and it must be either true or false.',
        param: 'isWorkout',
        location: 'body',
      },
      {
        value: '',
        msg: 'IsPerson is required and it must be either true or false.',
        param: 'isPerson',
        location: 'body',
      },
    ]);
    expect(res.body.function).toBe('validateReqBody');
    //expect(res.body.data).toStrictEqual(newTag);
  });
});

describe('Update (put) an existing tag with valid data.', () => {
});

describe('Update (put) an existing tag with invalid data.', () => {
});

describe('Update (put) an existing tag that breaks referential integrity.', () => {
});

describe('Update (put) a non-existing tag with valid data.', () => {
});

describe('Update (put) a non-existing tag with invalid data.', () => {
});

describe('Delete an existing tag.', () => {
});

describe('Delete an existing tag that breaks referential integrity.', () => {
});

describe('Delete a non-existing tag.', () => {
});

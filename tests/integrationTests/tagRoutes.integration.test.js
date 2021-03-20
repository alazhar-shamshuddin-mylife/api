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
const Note = require('../../models/note');
const Tag = require('../../models/tag');

let seededTags;

beforeAll(async () => {
  const seededData = await seedData.seedData();
  seededTags = seededData.seededTags;
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
  const nonExistentTagId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  let res;

  test('The HTTP response status and body should indicate error.', async () => {
    res = await request(app).get(`/api/tags/${nonExistentTagId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a note with ID '${nonExistentTagId}'.`]);
  });

  test('The data in the response body should match the non-existent tag ID.', async () => {
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
  let numTagsStart;

  test('The HTTP response status and body should indicate success.', async () => {
    numTagsStart = await Tag.countDocuments();
    res = await request(app)
      .post('/api/tags')
      .send(newTag);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the new tag.', async () => {
    expect(res.body.data.name).toBe(newTag.name);
    expect(res.body.data.isType).toBe(newTag.isType);
    expect(res.body.data.isTag).toBe(newTag.isTag);
    expect(res.body.data.isWorkout).toBe(newTag.isWorkout);
    expect(res.body.data.isPerson).toBe(newTag.isPerson);
    expect(res.body.data.description).toBe(newTag.description);
  });

  test('The number of tags should increase by one.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart + 1);
  });
});

describe('Create an invalid, new tag.', () => {
  let res;
  let numTagsStart;

  beforeAll(async () => {
    numTagsStart = await Tag.countDocuments();
  });

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
    expect(res.body.data.name).toBe(newTag.name);
    // expect(res.body.data.isType).toBe(newTag.isType);
    // expect(res.body.data.isTag).toBe(newTag.isTag);
    // expect(res.body.data.isWorkout).toBe(newTag.isWorkout);
    // expect(res.body.data.isPerson).toBe(newTag.isPerson);
    expect(res.body.data.description).toBe(newTag.description);
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
    expect(res.body.data.name).toBe(newTag.name);
    // expect(res.body.data.isType).toBe(newTag.isType);
    // expect(res.body.data.isTag).toBe(newTag.isTag);
    // expect(res.body.data.isWorkout).toBe(newTag.isWorkout);
    // expect(res.body.data.isPerson).toBe(newTag.isPerson);
    expect(res.body.data.description).not.toHaveProperty('description');
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
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
  let res;
  let numTagsStart;
  let unusedTag;

  test('The HTTP response status and body should indicate success.', async () => {
    unusedTag = seededTags.find((tag) => tag.name === 'Health');
    numTagsStart = await Tag.countDocuments();
    res = await request(app).delete(`/api/tags/${unusedTag.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the deleted tag.', async () => {
    // @todo: expect(res.body.data).toBe(unusedTag);
    expect(true).toBe(true);
  });

  test('The number of tags should decrease by one.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart - 1);
  });
});

describe('Delete an existing tag that breaks referential integrity with note types.', () => {
  let res;
  let numTagsStart;
  let usedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Bike Ride');
    numTagsStart = await Tag.countDocuments();
    res = await request(app).delete(`/api/tags/${usedTag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${usedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.type field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete an existing tag that breaks referential integrity with note tags.', () => {
  let res;
  let numTagsStart;
  let usedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Biking');
    numTagsStart = await Tag.countDocuments();
    res = await request(app).delete(`/api/tags/${usedTag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${usedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.tags field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete an existing tag that breaks referential integrity with workouts.', () => {
  let res;
  let numTagsStart;
  let usedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Grouse Grind');
    numTagsStart = await Tag.countDocuments();
    res = await request(app).delete(`/api/tags/${usedTag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${usedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.workout field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete an existing tag that breaks referential integrity with people tags.', () => {
  let res;
  let numTagsStart;
  let usedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Family');
    numTagsStart = await Tag.countDocuments();
    res = await request(app).delete(`/api/tags/${usedTag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${usedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 people.tags field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete a non-existing tag.', () => {
  const nonExistentTagId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  let res;
  let numTagsStart;

  test('The HTTP response status and body should indicate error.', async () => {
    numTagsStart = await Tag.countDocuments();
    res = await request(app).delete(`/api/tags/${nonExistentTagId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a tag with ID '${nonExistentTagId}'.`]);
  });

  test('The data in the response body should match the non-existent tag ID.', async () => {
    expect(res.body.data).toBe(nonExistentTagId);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

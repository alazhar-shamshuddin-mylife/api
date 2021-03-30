/**
 * This file contains integration tests for all REST API routes related
 * to tags (i.e., /api/tags*)
 *
 * @author Alazhar Shamshuddin.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../app');
const miscHelper = require('../helpers/miscHelper');
const seedData = require('../helpers/seedData');
const Person = require('../../models/person');
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

describe('Get the number of existing tags.', () => {
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
      expect(res.body.data[index]._id).toBe(tag._id.toString());
      expect(res.body.data[index].name).toBe(tag.name);
      expect(res.body.data[index].isType).toBe(tag.isType);
      expect(res.body.data[index].isTag).toBe(tag.isTag);
      expect(res.body.data[index].isWorkout).toBe(tag.isWorkout);
      expect(res.body.data[index].isPerson).toBe(tag.isPerson);
      expect(res.body.data[index].description).toBe(tag.description);
      expect(JSON.stringify(res.body.data[index].createdAt)).toBe(JSON.stringify(tag.createdAt));
      expect(JSON.stringify(res.body.data[index].updatedAt)).toBe(JSON.stringify(tag.updatedAt));
    });
  });
});

describe('Get an existing tag.', () => {
  let tag;
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    [tag] = seededTags;

    res = await request(app).get(`/api/tags/${tag.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded tag.', async () => {
    expect(res.body.data._id).toBe(tag._id.toString());
    expect(res.body.data.name).toBe(tag.name);
    expect(res.body.data.isType).toBe(tag.isType);
    expect(res.body.data.isTag).toBe(tag.isTag);
    expect(res.body.data.isWorkout).toBe(tag.isWorkout);
    expect(res.body.data.isPerson).toBe(tag.isPerson);
    expect(res.body.data.description).toBe(tag.description);
    expect(JSON.stringify(res.body.data.createdAt)).toBe(JSON.stringify(tag.createdAt));
    expect(JSON.stringify(res.body.data.updatedAt)).toBe(JSON.stringify(tag.updatedAt));
  });
});

describe('Get a non-existing tag.', () => {
  let res;

  test('The HTTP response status and body should indicate error.', async () => {
    res = await request(app).get(`/api/tags/${seedData.nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a note with ID '${seedData.nonExistentId}'.`]);
  });

  test('The data in the response body should match the non-existent tag ID.', async () => {
    expect(res.body.data).toBe(seedData.nonExistentId);
  });
});

describe('Create a valid, new tag.', () => {
  const tag = {
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
      .send(tag);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the new tag.', async () => {
    expect(res.body.data.name).toBe(tag.name);
    expect(res.body.data.isType).toBe(tag.isType);
    expect(res.body.data.isTag).toBe(tag.isTag);
    expect(res.body.data.isWorkout).toBe(tag.isWorkout);
    expect(res.body.data.isPerson).toBe(tag.isPerson);
    expect(res.body.data.description).toBe(tag.description);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(true);
    expect(res.body.data.updatedAt).toBe(res.body.data.createdAt);
  });

  test('The number of tags should increase by one.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart + 1);
  });
});

describe('Create a new tag with a duplicate name', () => {
  let res;
  let numTagsStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const tag = {
      name: 'Travelling',
      isType: false,
      isTag: true,
      isWorkout: false,
      isPerson: false,
      description: 'A tag for my out-of-province trips.',
    };

    numTagsStart = await Tag.countDocuments();
    res = await request(app)
      .post('/api/tags')
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A tag called '${tag.name}' already exists.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      name: 'Travelling',
      isType: 'false',
      isTag: 'true',
      isWorkout: 'false',
      isPerson: 'false',
      description: 'A tag for my out-of-province trips.',
    });
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Create a new tag with other invalid properties.', () => {
  let res;
  let numTagsStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const newTag = {
      isType: '',
      isTag: 0,
      isWorkout: null,
      isPerson: undefined,
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .post('/api/tags')
      .send(newTag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: '',
        msg: 'A tag name is required; it must be between 1 and 25 characters long.',
        param: 'name',
        location: 'body',
      },
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
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      name: '',
      isType: '',
      isTag: '0',
      isWorkout: '',
      description: '',
      isPerson: '',
    });
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing, unused tag with valid properties.', () => {
  let res;
  let numTagsStart;
  let unusedTag;
  let tag;

  test('The HTTP response status and body should indicate success.', async () => {
    unusedTag = await Tag.findOne({ name: 'Health' });

    tag = {
      id: unusedTag.id,
      name: `${unusedTag.name}_v2`,
      isType: !unusedTag.isType,
      isTag: !unusedTag.isTag,
      isWorkout: !unusedTag.isWorkout,
      isPerson: !unusedTag.isPerson,
      description: `${unusedTag.description}_v2`,
    };

    numTagsStart = await Tag.countDocuments();
    res = await request(app)
      .put(`/api/tags/${unusedTag.id}`)
      .send(tag);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the updated tag.', async () => {
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.isType).toBe(tag.isType);
    expect(res.body.data.isTag).toBe(tag.isTag);
    expect(res.body.data.isWorkout).toBe(tag.isWorkout);
    expect(res.body.data.isPerson).toBe(tag.isPerson);
    expect(res.body.data.description).toBe(tag.description);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);
  });

  test('The changes to the updated tag persist via a call to GET.', async () => {
    res = await request(app).get(`/api/tags/${unusedTag.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.name).toBe(tag.name);
    expect(res.body.data.isType).toBe(tag.isType);
    expect(res.body.data.isTag).toBe(tag.isTag);
    expect(res.body.data.isWorkout).toBe(tag.isWorkout);
    expect(res.body.data.isPerson).toBe(tag.isPerson);
    expect(res.body.data.description).toBe(tag.description);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing, used tag with valid properties.', () => {
  let res;
  let numTagsStart;
  let unusedTag;
  let tag;

  test('The HTTP response status and body should indicate success.', async () => {
    unusedTag = await Tag.findOne({ name: 'Biking' });

    tag = {
      id: unusedTag.id,
      name: `${unusedTag.name}_v2`,
      isType: !unusedTag.isType,
      isTag: unusedTag.isTag,
      isWorkout: !unusedTag.isWorkout,
      isPerson: !unusedTag.isPerson,
      description: `${unusedTag.description}_v2`,
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${unusedTag.id}`)
      .send(tag);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the new tag.', async () => {
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.name).toBe(tag.name);
    expect(res.body.data.isType).toBe(tag.isType);
    expect(res.body.data.isTag).toBe(tag.isTag);
    expect(res.body.data.isWorkout).toBe(tag.isWorkout);
    expect(res.body.data.isPerson).toBe(tag.isPerson);
    expect(res.body.data.description).toBe(tag.description);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);
  });

  test('The changes to the updated tag persist via a call to GET.', async () => {
    res = await request(app).get(`/api/tags/${unusedTag.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.name).toBe(tag.name);
    expect(res.body.data.isType).toBe(tag.isType);
    expect(res.body.data.isTag).toBe(tag.isTag);
    expect(res.body.data.isWorkout).toBe(tag.isWorkout);
    expect(res.body.data.isPerson).toBe(tag.isPerson);
    expect(res.body.data.description).toBe(tag.description);
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing tag with a duplicate name.', () => {
  let res;
  let numTagsStart;
  let existingTag1;
  let existingTag2;
  let tag;

  test('The HTTP response status and body should indicate failure.', async () => {
    existingTag1 = await Tag.findOne({ name: 'Hike' });
    existingTag2 = await Tag.findOne({ name: 'Family' });

    tag = {
      id: existingTag1.id,
      name: existingTag2.name,
      isType: false,
      isTag: true,
      isWorkout: false,
      isPerson: false,
      description: 'A tag for my out-of-province trips.',
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${existingTag1.id}`)
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A tag called '${existingTag2.name}' already exists.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      id: existingTag1.id,
      name: existingTag2.name,
      isType: 'false',
      isTag: 'true',
      isWorkout: 'false',
      isPerson: 'false',
      description: 'A tag for my out-of-province trips.',
    });
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing tag with other invalid properties.', () => {
  let res;
  let numTagsStart;
  let existingTag;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    existingTag = await Tag.findOne({ name: 'Life' });

    tag = {
      id: existingTag.id,
      name: 1254, // Not alphanumeric but okay (for now)
      isType: undefined, // Not a boolean
      isTag: null, // Not a boolean
      isWorkout: '', // Not a boolean
      isPerson: 0, // Not boolean but truthy -- okay
      // Description tag is missing
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${existingTag.id}`)
      .send(tag);
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
        msg: 'IsTag is required and it must be either true or false.',
        param: 'isTag',
        location: 'body',
      },
      {
        value: '',
        msg: 'IsWorkout is required and it must be either true or false.',
        param: 'isWorkout',
        location: 'body',
      },
    ]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      id: tag.id,
      name: '1254',
      isTag: '',
      isWorkout: '',
      isPerson: '0',
      description: '',
      isType: '',
    });
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing tag that breaks referential integrity with note types.', () => {
  let res;
  let numTagsStart;
  let usedTag;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = await Tag.findOne({ name: 'Bike Ride' });

    tag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${tag.id}`)
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.type field(s).`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing tag that breaks referential integrity with note tags.', () => {
  let res;
  let numTagsStart;
  let usedTag;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = await Tag.findOne({ name: 'Exploring' });

    tag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${tag.id}`)
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.tags field(s).`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing tag that breaks referential integrity with workouts.', () => {
  let res;
  let numTagsStart;
  let usedTag;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = await Tag.findOne({ name: 'Grouse Grind' });

    tag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${tag.id}`)
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.workout field(s).`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing tag that breaks referential integrity with people tags.', () => {
  let res;
  let numTagsStart;
  let usedTag;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = await Tag.findOne({ name: 'Family' });
    const numReferences = await Person.find({ tags: usedTag._id }).countDocuments();

    tag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${tag.id}`)
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: ${numReferences} people.tags field(s).`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) a non-existing tag with valid properties.', () => {
  let res;
  let numTagsStart;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    tag = {
      id: seedData.nonExistentId,
      name: 'Health',
      isType: true,
      isTag: false,
      isWorkout: false,
      isPerson: false,
      description: '',
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${seedData.nonExistentId}`)
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A tag with ID '${seedData.nonExistentId}' does not exist.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      id: seedData.nonExistentId,
      name: 'Health',
      isType: 'true',
      isTag: 'false',
      isWorkout: 'false',
      isPerson: 'false',
      description: '',
    });
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) a non-existing tag with invalid properties.', () => {
  let res;
  let numTagsStart;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    tag = {
      id: seedData.nonExistentId,
      name: 'Health',
      isType: 'isType',
      isTag: 123456789,
    };

    numTagsStart = await Tag.countDocuments();

    res = await request(app)
      .put(`/api/tags/${seedData.nonExistentId}`)
      .send(tag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        msg: 'Description is required but it can be an empty string.',
        param: 'description',
        location: 'body',
      },
      {
        value: 'isType',
        msg: 'IsType is required and it must be either true or false.',
        param: 'isType',
        location: 'body',
      },
      {
        value: '123456789',
        msg: 'IsTag is required and it must be either true or false.',
        param: 'isTag',
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
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      id: seedData.nonExistentId,
      name: 'Health',
      isType: 'isType',
      isTag: '123456789',
      description: '',
      isWorkout: '',
      isPerson: '',
    });
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete an existing, unused tag.', () => {
  let res;
  let numTagsStart;
  let tag;

  test('The HTTP response status and body should indicate success.', async () => {
    tag = await Tag.findOne({ name: 'Hike' });

    numTagsStart = await Tag.countDocuments();

    res = await request(app).delete(`/api/tags/${tag.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the deleted tag.', async () => {
    expect(res.body.data._id).toBe(tag._id.toString());
  });

  test('The number of tags should decrease by one.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart - 1);
  });
});

describe('Delete an existing tag that breaks referential integrity with note types.', () => {
  let res;
  let numTagsStart;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    tag = await Tag.findOne({ name: 'Bike Ride' });

    numTagsStart = await Tag.countDocuments();

    res = await request(app).delete(`/api/tags/${tag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.type field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(tag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete an existing tag that breaks referential integrity with note tags.', () => {
  let res;
  let numTagsStart;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    tag = await Tag.findOne({ name: 'Exploring' });

    numTagsStart = await Tag.countDocuments();

    res = await request(app).delete(`/api/tags/${tag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.tags field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(tag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete an existing tag that breaks referential integrity with workouts.', () => {
  let res;
  let numTagsStart;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    tag = await Tag.findOne({ name: 'Grouse Grind' });

    numTagsStart = await Tag.countDocuments();

    res = await request(app).delete(`/api/tags/${tag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.workout field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(tag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete an existing tag that breaks referential integrity with people tags.', () => {
  let res;
  let numTagsStart;
  let tag;

  test('The HTTP response status and body should indicate error.', async () => {
    tag = await Tag.findOne({ name: 'Family' });
    const numReferences = await Person.find({ tags: tag._id }).countDocuments();

    numTagsStart = await Tag.countDocuments();

    res = await request(app).delete(`/api/tags/${tag.id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete tag with ID '${tag.id}' without breaking referential integrity.  The tag is referenced in: ${numReferences} people.tags field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(tag.id);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Delete a non-existing tag.', () => {
  let res;
  let numTagsStart;

  test('The HTTP response status and body should indicate error.', async () => {
    numTagsStart = await Tag.countDocuments();

    res = await request(app).delete(`/api/tags/${seedData.nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a tag with ID '${seedData.nonExistentId}'.`]);
  });

  test('The data in the response body should match the non-existent tag ID.', async () => {
    expect(res.body.data).toBe(seedData.nonExistentId);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

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
      expect(res.body.data[index]._id).toBe(tag._id.toString());
      expect(res.body.data[index].name).toBe(tag.name);
      expect(res.body.data[index].isType).toBe(tag.isType);
      expect(res.body.data[index].isTag).toBe(tag.isTag);
      expect(res.body.data[index].isWorkout).toBe(tag.isWorkout);
      expect(res.body.data[index].isPerson).toBe(tag.isPerson);
      expect(res.body.data[index].description).toBe(tag.description);
      expect(res.body.data[index].createdAt).toBeDefined();
      expect(res.body.data[index].updatedAt).toBeDefined();
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
    expect(res.body.data._id).toBe(seededTags[0]._id.toString());
    expect(res.body.data.name).toBe(seededTags[0].name);
    expect(res.body.data.isType).toBe(seededTags[0].isType);
    expect(res.body.data.isTag).toBe(seededTags[0].isTag);
    expect(res.body.data.isWorkout).toBe(seededTags[0].isWorkout);
    expect(res.body.data.isPerson).toBe(seededTags[0].isPerson);
    expect(res.body.data.description).toBe(seededTags[0].description);
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
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
    expect(res.body.data).toStrictEqual({
      name: 'Travelling',
      isType: 'false',
      isTag: 'true',
      isWorkout: 'false',
      isPerson: 'false',
      description: 'A tag for my out-of-province trips.'
    });
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
    expect(res.body.data).toStrictEqual({
      name: 'Travelling',
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

describe('Update (put) an existing, unused tag with valid data.', () => {
  let res;
  let numTagsStart;
  let unusedTag;
  let changedTag;

  test('The HTTP response status and body should indicate success.', async () => {
    unusedTag = seededTags.find((tag) => tag.name === 'Health');

    changedTag = {
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
      .send(changedTag);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the new tag.', async () => {
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.name).toBe(changedTag.name);
    expect(res.body.data.isType).toBe(changedTag.isType);
    expect(res.body.data.isTag).toBe(changedTag.isTag);
    expect(res.body.data.isWorkout).toBe(changedTag.isWorkout);
    expect(res.body.data.isPerson).toBe(changedTag.isPerson);
    expect(res.body.data.description).toBe(changedTag.description);
  });

  test('The changes to the updated tag persist via a call to GET.', async () => {
    res = await request(app).get(`/api/tags/${unusedTag.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.name).toBe(changedTag.name);
    expect(res.body.data.isType).toBe(changedTag.isType);
    expect(res.body.data.isTag).toBe(changedTag.isTag);
    expect(res.body.data.isWorkout).toBe(changedTag.isWorkout);
    expect(res.body.data.isPerson).toBe(changedTag.isPerson);
    expect(res.body.data.description).toBe(changedTag.description);
  });

  test('The number of tags should not have changed.', async () => {
    res = await request(app).get('/api/tags/count');
    expect(res.body.data).toBe(numTagsStart);
  });
});

describe('Update (put) an existing, used tag with valid data.', () => {
  let res;
  let unusedTag;
  let changedTag;

  test('The HTTP response status and body should indicate success.', async () => {
    unusedTag = seededTags.find((tag) => tag.name === 'Biking');

    changedTag = {
      id: unusedTag.id,
      name: `${unusedTag.name}_v2`,
      isType: !unusedTag.isType,
      isTag: unusedTag.isTag,
      isWorkout: !unusedTag.isWorkout,
      isPerson: !unusedTag.isPerson,
      description: `${unusedTag.description}_v2`,
    };

    res = await request(app)
      .put(`/api/tags/${unusedTag.id}`)
      .send(changedTag);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the new tag.', async () => {
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.name).toBe(changedTag.name);
    expect(res.body.data.isType).toBe(changedTag.isType);
    expect(res.body.data.isTag).toBe(changedTag.isTag);
    expect(res.body.data.isWorkout).toBe(changedTag.isWorkout);
    expect(res.body.data.isPerson).toBe(changedTag.isPerson);
    expect(res.body.data.description).toBe(changedTag.description);
  });

  test('The changes to the updated tag persist via a call to GET.', async () => {
    res = await request(app).get(`/api/tags/${unusedTag.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data._id).toBe(unusedTag.id);
    expect(res.body.data.name).toBe(changedTag.name);
    expect(res.body.data.isType).toBe(changedTag.isType);
    expect(res.body.data.isTag).toBe(changedTag.isTag);
    expect(res.body.data.isWorkout).toBe(changedTag.isWorkout);
    expect(res.body.data.isPerson).toBe(changedTag.isPerson);
    expect(res.body.data.description).toBe(changedTag.description);
  });
});

describe('Update (put) an existing tag with invalid data.', () => {
  let res;
  let unusedTag;
  let changedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    unusedTag = seededTags.find((tag) => tag.name === 'Health');

    changedTag = {
      id: unusedTag.id,
      name: 1254, // Not alphanumeric but okay (for now)
      isType: undefined, // Not a boolean
      isTag: null, // Not a boolean
      isWorkout: '', // Not a boolean
      isPerson: 0, // Not boolean but truthy -- okay
      // Description tag is missing
    };

    res = await request(app)
      .put(`/api/tags/${unusedTag.id}`)
      .send(changedTag);
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

  test('The data in the response body should match the new tag.', async () => {
    expect(res.body.data).toStrictEqual({
      id: changedTag.id,
      name: '1254',
      isTag: '',
      isWorkout: '',
      isPerson: '0',
      description: '',
      isType: '',
    });
  });
});

describe('Update (put) an existing tag that breaks referential integrity with note types.', () => {
  let res;
  let usedTag;
  let changedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Bike Ride');

    changedTag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    res = await request(app)
      .put(`/api/tags/${changedTag.id}`)
      .send(changedTag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${changedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.type field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });
});

describe('Update (put) an existing tag that breaks referential integrity with note tags.', () => {
  let res;
  let usedTag;
  let changedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Biking');

    changedTag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    res = await request(app)
      .put(`/api/tags/${changedTag.id}`)
      .send(changedTag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${changedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.tags field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });
});

describe('Update (put) an existing tag that breaks referential integrity with workouts.', () => {
  let res;
  let usedTag;
  let changedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Grouse Grind');

    changedTag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    res = await request(app)
      .put(`/api/tags/${changedTag.id}`)
      .send(changedTag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${changedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 notes.workout field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });
});

describe('Update (put) an existing tag that breaks referential integrity with people tags.', () => {
  let res;
  let usedTag;
  let changedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    usedTag = seededTags.find((tag) => tag.name === 'Family');

    changedTag = {
      id: `${usedTag.id}`,
      name: `${usedTag.name}_v2`,
      isType: !usedTag.isType,
      isTag: !usedTag.isTag,
      isWorkout: !usedTag.isWorkout,
      isPerson: !usedTag.isPerson,
      description: `${usedTag.description}_v2`,
    };

    res = await request(app)
      .put(`/api/tags/${changedTag.id}`)
      .send(changedTag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot update tag with ID '${changedTag.id}' without breaking referential integrity.  The tag is referenced in: 1 people.tags field(s).`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toBe(usedTag.id);
  });
});

describe('Update (put) a non-existing tag with valid data.', () => {
  const nonExistentTagId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  let res;
  let unusedTag;
  let changedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    unusedTag = seededTags.find((tag) => tag.name === 'Health');

    changedTag = {
      id: nonExistentTagId,
      name: `${unusedTag.name}`,
      isType: unusedTag.isType,
      isTag: unusedTag.isTag,
      isWorkout: unusedTag.isWorkout,
      isPerson: unusedTag.isPerson,
      description: `${unusedTag.description}`,
    };

    res = await request(app)
      .put(`/api/tags/${nonExistentTagId}`)
      .send(changedTag);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A tag with ID '${nonExistentTagId}' does not exist.`]);
  });

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toStrictEqual({
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'Health',
      isType: 'true',
      isTag: 'false',
      isWorkout: 'false',
      isPerson: 'false',
      description: '',
    });
  });
});

describe('Update (put) a non-existing tag with invalid data.', () => {
  const nonExistentTagId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  let res;
  let unusedTag;
  let changedTag;

  test('The HTTP response status and body should indicate error.', async () => {
    unusedTag = seededTags.find((tag) => tag.name === 'Health');

    changedTag = {
      id: nonExistentTagId,
      name: `${unusedTag.name}`,
      isType: 'isType',
      isTag: 123456789,
    };

    res = await request(app)
      .put(`/api/tags/${nonExistentTagId}`)
      .send(changedTag);
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

  test('The data in the response body should match the requested tag ID.', async () => {
    expect(res.body.data).toStrictEqual({
      id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      name: 'Health',
      isType: 'isType',
      isTag: '123456789',
      description: '',
      isWorkout: '',
      isPerson: '',
    });
  });
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
    expect(res.body.data._id).toBe(unusedTag._id.toString());
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

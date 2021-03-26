/**
 * This file contains integration tests for all REST API routes related
 * to people (i.e., /api/people*)
 *
 * @author Alazhar Shamshuddin.
 */

const mongoose = require('mongoose');
const request = require('supertest');
const util = require('util');
const app = require('../../app');
const seedData = require('../testHelpers/seedData');
const Person = require('../../models/person');
const Tag = require('../../models/tag');

let seededPeople;
let seededTags;

beforeAll(async () => {
  const seededData = await seedData.seedData();
  seededPeople = seededData.seededPeople;
  seededTags = seededData.seededTags;
});

/* Note: The mongoose connection is created by the Express app (i.e., by
 * requiring ../../app.js).
 */
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Get the number of existing people.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get('/api/people/count');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should indicate the number of seeded tags.', async () => {
    const numSeededPeople = await Person.countDocuments();
    expect(res.body.data).toBe(numSeededPeople);
  });
});

describe('Get all existing people.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get('/api/people');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded people.', async () => {
    const seededPeopleSorted = seededPeople.sort((a, b) => (a.name > b.name) - (a.name < b.name));

    seededPeopleSorted.forEach((person, index) => {
      expect(res.body.data[index]._id).toBe(person._id.toString());
      expect(res.body.data[index].firstName).toBe(person.firstName);
      expect(res.body.data[index].middleName).toBe(person.middleName);
      expect(res.body.data[index].lastName).toBe(person.lastName);
      expect(res.body.data[index].preferredName).toBe(person.preferredName);
      expect(res.body.data[index].googlePhotoUrl).toBe(person.googlePhotoUrl);
      expect(res.body.data[index].picasaContactId).toBe(person.picasaContactId);
      expect(JSON.stringify(res.body.data[index].notes)).toBe(JSON.stringify(person.notes));
      expect(JSON.stringify(res.body.data[index].photos)).toBe(JSON.stringify(person.photos));
      expect(JSON.stringify(res.body.data[index].birthdate)).toBe(JSON.stringify(person.birthdate));
      expect(JSON.stringify(res.body.data[index].createdAt)).toBe(JSON.stringify(person.createdAt));
      expect(JSON.stringify(res.body.data[index].updatedAt)).toBe(JSON.stringify(person.updatedAt));

      const resBodyTags = res.body.data[index].tags.map((tag) => tag._id);
      expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(person.tags));
    });
  });
});

describe('Get an existing person.', () => {
  let person;
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    [person] = seededPeople;

    res = await request(app).get(`/api/people/${person.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the seeded person.', async () => {
    expect(res.body.data._id).toBe(person._id.toString());
    expect(res.body.data.firstName).toBe(person.firstName);
    expect(res.body.data.middleName).toBe(person.middleName);
    expect(res.body.data.lastName).toBe(person.lastName);
    expect(res.body.data.preferredName).toBe(person.preferredName);
    expect(res.body.data.googlePhotoUrl).toBe(person.googlePhotoUrl);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);
    expect(JSON.stringify(res.body.data.notes)).toBe(JSON.stringify(person.notes));
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    expect(JSON.stringify(res.body.data.birthdate)).toBe(JSON.stringify(person.birthdate));
    expect(JSON.stringify(res.body.data.createdAt)).toBe(JSON.stringify(person.createdAt));
    expect(JSON.stringify(res.body.data.updatedAt)).toBe(JSON.stringify(person.updatedAt));

    const resBodyTags = res.body.data.tags.map((tag) => tag._id);
    expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(person.tags));
  });
});

describe('Get a non-existing person.', () => {
  let res;

  test('The HTTP response status and body should indicate error.', async () => {
    res = await request(app).get(`/api/people/${seedData.nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a person with ID '${seedData.nonExistentId}'.`]);
  });

  test('The data in the response body should match the non-existent person ID.', async () => {
    expect(res.body.data).toBe(seedData.nonExistentId);
  });
});

describe('Create a valid, new person.', () => {
  const person = {
    firstName: 'Michael',
    middleName: '',
    lastName: 'Smith',
    preferredName: 'Mike',
    birthdate: '1985-12-31',
    googlePhotoUrl: '',
    notes: [
      {
        note: 'This is the first example note.',
        date: '2021-03-19',
      },
      {
        note: 'This is the second (2nd) example note.',
        date: '2018-11-26',
      },
    ],
    photos: [],
    picasaContactId: '',
    tags: ['Family', 'Friend'],
  };

  let res;
  let numPeopleStart;

  test('The HTTP response status and body should indicate success.', async () => {
    numPeopleStart = await Person.countDocuments();

    res = await request(app)
      .post('/api/people')
      .send(person);
    console.log(res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should match the new person.', async () => {
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.firstName).toBe(person.firstName);
    expect(res.body.data.middleName).toBe(person.middleName);
    expect(res.body.data.lastName).toBe(person.lastName);
    expect(res.body.data.preferredName).toBe(person.preferredName);
    expect(res.body.data.googlePhotoUrl).toBe(person.googlePhotoUrl);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);
    // @todo expect(JSON.stringify(res.body.data.notes)).toBe(JSON.stringify(person.notes));
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    // @todo expect(JSON.stringify(res.body.data.birthdate)).toBe(JSON.stringify(person.birthdate));
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBe(res.body.data.createdAt);

    const tags = await Tag.find({ name: { $in: person.tags }}, 'name id').sort('name');
    const tagIds = tags.map((tag) => tag.id);
    expect(res.body.data.tags).toStrictEqual(tagIds);
  });

  test('The number of people should increase by one.', async () => {
    res = await request(app).get('/api/people/count');
    expect(res.body.data).toBe(numPeopleStart + 1);
  });
});

describe('Create a new person with a duplicate name.', () => {}); // @todo: Add to tags
describe('Create an invalid, new person.', () => {});
  // use an valid tag where isPerson is false
  // use a tag that does not exist
describe('Update (put) an existing, unused person with valid data.', () => {});
describe('Update (put) an existing, used person with valid data.', () => {});
describe('Update (put) an existing, used person with a new tag.', () => {}); // @todo
describe('Update (put) an existing, used person with a new name.', () => {}); // @todo
describe('Update (put) an existing, used person with a duplicate name.', () => {}); // @todo
describe('Update (put) an existing person with invalid data.', () => {});
describe('Update (put) a non-existing tag with valid data.', () => {});
describe('Update (put) a non-existing tag with invalid data.', () => {});
describe('Delete an existing, unused person.', () => {});
describe('Delete an existing person that breaks referential integrity with a note.', () => {});
describe('Delete a non-existing person.', () => {});

describe('Update (put) an existing tag that breaks referential integrity with people tags.', () => {});
describe('Delete an existing tag that breaks referential integrity with people tags.', () => {});

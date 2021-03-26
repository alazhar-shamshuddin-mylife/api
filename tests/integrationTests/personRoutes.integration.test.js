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
const miscHelper = require('../helpers/miscHelper');
const seedData = require('../helpers/seedData');
const Tag = require('../../models/tag');
const Person = require('../../models/person');



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
    expect(new Date(res.body.data.birthdate)).toStrictEqual(new Date(person.birthdate));
    expect(res.body.data.googlePhotoUrl).toBe(person.googlePhotoUrl);
    expect(miscHelper.areNotesEqual(res.body.data.notes, person.notes)).toBe(true);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);  
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(true);
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

describe('Create a new person with a duplicate (first, middle and last) name.', () => {
  let res;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const person = {
      firstName: 'Michael',
      middleName: '',
      lastName: 'Smith',
      preferredName: 'Mikey',
      birthdate: '1950-10-31',
      googlePhotoUrl: '',
      notes: [],
      photos: [],
      picasaContactId: '',
      tags: ['Friend'],
    };
  
    numPeopleStart = await Person.countDocuments();
    res = await request(app)
      .post('/api/people')
      .send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A person with following first, middle and last names already exist: '${person.firstName}', '${person.middleName}', '${person.lastName}'.`]);
  });  

  test('The number of people should not have changed.', async () => {
    res = await request(app).get('/api/people/count');
    expect(res.body.data).toBe(numPeopleStart);
  });  
});

describe('Create a new person with an invalid tag.', () => {
  let res;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const tmpTags = await Tag.find({ isPerson: false }, 'name').limit(2);
    const nonPersonTags = tmpTags.map((tag) => tag.name );

    const person = {
      firstName: 'Michael',
      middleName: 'J.',
      lastName: 'Fox',
      preferredName: 'Mikey',
      birthdate: '1950-10-31',
      googlePhotoUrl: '',
      notes: [],
      photos: [],
      picasaContactId: '',
      tags: nonPersonTags,
    };
  
    numPeopleStart = await Person.countDocuments();
    res = await request(app)
      .post('/api/people')
      .send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid tag(s): ${nonPersonTags.join(', ')}.`]);
  });  

  test('The number of people should not have changed.', async () => {
    res = await request(app).get('/api/people/count');
    expect(res.body.data).toBe(numPeopleStart);
  });   
});

describe('Create a new person with non-existent tag.', () => {
  let res;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const nonPersonTags = ['Does not exist'];

    const person = {
      firstName: 'Michael',
      middleName: 'J.',
      lastName: 'Fox',
      preferredName: 'Mikey',
      birthdate: '1950-10-31',
      googlePhotoUrl: '',
      notes: [],
      photos: [],
      picasaContactId: '',
      tags: nonPersonTags,
    };
  
    numPeopleStart = await Person.countDocuments();
    res = await request(app)
      .post('/api/people')
      .send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid tag(s): ${nonPersonTags.join(', ')}.`]);
  });  

  test('The number of people should not have changed.', async () => {
    res = await request(app).get('/api/people/count');
    expect(res.body.data).toBe(numPeopleStart);
  });   
});

describe('Create a new person with other invalid properties.', () => {
  let res;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const person = {
      middleName: 'A_name_longer_than_25_characters',
      lastName: '',
      preferredName: undefined,
      birthdate: '1950-09-31',
      googlePhotoUrl: false,
      notes: {},
      photos: [],
      picasaContactId: '1234',
      tags: 'Friend',
    };
  
    numPeopleStart = await Person.countDocuments();
    res = await request(app)
      .post('/api/people')
      .send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: '',
        msg: 'First name is required; it must be between 1 and 25 characters long.',
        param: 'firstName',
        location: 'body'
      },
      {
        value: 'A_name_longer_than_25_characters',
        msg: 'Middle is required; it must be between 0 and 25 characters long.',
        param: 'middleName',
        location: 'body'
      },
      {
        msg: 'Preferred name is required; it must be between 0 and 25 characters long.',
        param: 'preferredName',
        location: 'body'
      },
      {
        value: '1950-09-31',
        msg: 'Birthdate must be a valid date.',
        param: 'birthdate',
        location: 'body'
      },
      {
        value: 'Friend',
        msg: 'Tags must be specified in an array.',
        param: 'tags',
        location: 'body'
      },
      {
        value: {},
        msg: 'Notes must be specified in an array; an empty array is okay.',
        param: 'notes',
        location: 'body'
      }
    ]);
  });  

  test('The number of people should not have changed.', async () => {
    res = await request(app).get('/api/people/count');
    expect(res.body.data).toBe(numPeopleStart);
  });   
});

describe('Update (put) an existing person with valid data.', () => {
  let res;
  let numPeopleStart;
  let oldPerson;
  let person;

  test('The HTTP response status and body should indicate success.', async () => {
    oldPerson = await Person.find({ firstName: 'Michael', lastName: 'Smith' });
    [oldPerson] = oldPerson;

    person = {
      firstName: `${oldPerson.firstName}_v2`,
      middleName: '',
      lastName: `${oldPerson.lastName}_v2`,
      preferredName: '',
      birthdate: '1980-12-31',
      googlePhotoUrl: '',
      notes: [{
        note: 'Some text',
        date: '2021-03-16',
      }],
      photos: [],
      picasaContactId: '',
      tags: ['Friend'],
    };

    numPeopleStart = await Person.countDocuments();
    res = await request(app)
      .put(`/api/people/${oldPerson.id}`)
      .send(person);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the updated person.', async () => {
    expect(res.body.data._id).toBe(oldPerson.id);
    expect(res.body.data.firstName).toBe(person.firstName);
    expect(res.body.data.middleName).toBe(person.middleName);
    expect(res.body.data.lastName).toBe(person.lastName);
    expect(res.body.data.preferredName).toBe(person.preferredName);
    expect(new Date(res.body.data.birthdate)).toStrictEqual(new Date(person.birthdate));
    expect(res.body.data.googlePhotoUrl).toBe(person.googlePhotoUrl);
    expect(miscHelper.areNotesEqual(res.body.data.notes, person.notes)).toBe(true);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);  
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);

    const tags = await Tag.find({ name: { $in: person.tags }}, 'name id').sort('name');
    const tagIds = tags.map((tag) => tag.id);
    expect(res.body.data.tags).toStrictEqual(tagIds);
  });

  test('The changes to the updated person persist via a call to GET.', async () => {
    res = await request(app).get(`/api/people/${oldPerson.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data._id).toBe(oldPerson.id);
    expect(res.body.data.firstName).toBe(person.firstName);
    expect(res.body.data.middleName).toBe(person.middleName);
    expect(res.body.data.lastName).toBe(person.lastName);
    expect(res.body.data.preferredName).toBe(person.preferredName);
    expect(new Date(res.body.data.birthdate)).toStrictEqual(new Date(person.birthdate));
    expect(res.body.data.googlePhotoUrl).toBe(person.googlePhotoUrl);
    expect(miscHelper.areNotesEqual(res.body.data.notes, person.notes)).toBe(true);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);  
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);

    const tags = await Tag.find({ name: { $in: person.tags }});
    const tagIds = tags.map((tag) => tag.id);
    const resTagIds = res.body.data.tags.map((tag) => tag._id);
    expect(resTagIds).toStrictEqual(tagIds);
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get('/api/people/count');
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Update (put) an existing, used person with a invalid tag.', () => {}); 


describe('Update (put) an existing, used person with a duplicate name.', () => {}); // @todo
describe('Update (put) an existing person with invalid data.', () => {});
describe('Update (put) a non-existing person with valid data.', () => {});
describe('Update (put) a non-existing person with invalid data.', () => {});
describe('Delete an existing, unused person.', () => {});
describe('Delete an existing person that breaks referential integrity with a note.', () => {});
describe('Delete a non-existing person.', () => {});

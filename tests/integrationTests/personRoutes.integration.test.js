/**
 * This file contains integration tests for all REST API routes related
 * to people (i.e., ${rootUrl}*)
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

const rootUrl = '/api/people';
let seededPeople;

beforeAll(async () => {
  const seededData = await seedData.seedData();
  seededPeople = seededData.seededPeople;
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
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.messages).toStrictEqual([]);
  });

  test('The data in the response body should indicate the number of seeded people.', async () => {
    const numSeededPeople = await Person.countDocuments();

    expect(res.body.data).toBe(numSeededPeople);
  });
});

describe('Get all existing people.', () => {
  let res;

  test('The HTTP response status and body should indicate success.', async () => {
    res = await request(app).get(rootUrl);
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

    res = await request(app).get(`${rootUrl}/${person._id}`);
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
    res = await request(app).get(`${rootUrl}/${seedData.nonExistentId}`);
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

    res = await request(app).post(rootUrl).send(person);
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
    expect(miscHelper.arePersonNotesEqual(res.body.data.notes, person.notes)).toBe(true);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(true);
    expect(res.body.data.updatedAt).toBe(res.body.data.createdAt);

    const tags = await Tag.find({ name: { $in: person.tags } }, 'name id').sort('name');
    const tagIds = tags.map((tag) => tag._id.toString());
    expect(res.body.data.tags).toStrictEqual(tagIds);
  });

  test('The number of people should increase by one.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart + 1);
  });
});

describe('Create a new person with a duplicate (first, middle and last) name.', () => {
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

  let res;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    numPeopleStart = await Person.countDocuments();

    res = await request(app).post(rootUrl).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A person with the following first, middle and last names already exists: '${person.firstName}', '${person.middleName}', '${person.lastName}'.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual(person);
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Create a new person with an invalid tag.', () => {
  let res;
  let person;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const tmpTags = await Tag.find({ isPerson: false }, 'name').limit(2);
    const nonPersonTags = tmpTags.map((tag) => tag.name);

    person = {
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

    res = await request(app).post(rootUrl).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid tag(s): ${nonPersonTags.join(', ')}.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual(person);
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Create a new person with non-existent tag.', () => {
  let res;
  let person;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    const nonPersonTags = ['Does not exist'];

    person = {
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

    res = await request(app).post(rootUrl).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid tag(s): ${nonPersonTags.join(', ')}.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual(person);
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Create a new person with other invalid properties.', () => {
  let res;
  let person;
  let numPeopleStart;

  test('The HTTP response status and body should indicate failure.', async () => {
    person = {
      middleName: 'A_name_longer_than_25_characters',
      lastName: '',
      preferredName: undefined,
      birthdate: '1950-09-31',
      googlePhotoUrl: false,
      notes: {},
      photos: [],
      picasaContactId: '12345678901234567',
      tags: 'Friend',
    };

    numPeopleStart = await Person.countDocuments();

    res = await request(app).post(rootUrl).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: '',
        msg: 'First name is required; it must be between 1 and 25 characters long.',
        param: 'firstName',
        location: 'body',
      },
      {
        value: 'A_name_longer_than_25_characters',
        msg: 'Middle is required; it must be between 0 and 25 characters long.',
        param: 'middleName',
        location: 'body',
      },
      {
        msg: 'Preferred name is required; it must be between 0 and 25 characters long.',
        param: 'preferredName',
        location: 'body',
      },
      {
        value: '1950-09-31',
        msg: 'Birthdate must be a valid date if it is specified.',
        param: 'birthdate',
        location: 'body',
      },
      {
        value: '12345678901234567',
        msg: 'A Picasa Contact ID is required; it can be an empty string or a 16-character ID.',
        param: 'picasaContactId',
        location: 'body',
      },
      {
        value: 'Friend',
        msg: 'Tags must be specified in an array.',
        param: 'tags',
        location: 'body',
      },
      {
        value: {},
        msg: 'Notes must be specified in an array; an empty array is okay.',
        param: 'notes',
        location: 'body',
      },
    ]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      middleName: 'A_name_longer_than_25_characters',
      lastName: '',
      birthdate: '1950-09-31',
      googlePhotoUrl: 'false',
      notes: {},
      photos: [],
      picasaContactId: '12345678901234567',
      tags: 'Friend',
      firstName: '',
      preferredName: '',
    });
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Update (put) an existing person with valid properties.', () => {
  let res;
  let numPeopleStart;
  let existingPerson;
  let person;

  test('The HTTP response status and body should indicate success.', async () => {
    existingPerson = await Person.findOne({ firstName: 'Michael', lastName: 'Smith' });
    const tag = await Tag.findOne({ isPerson: true });

    person = {
      firstName: `${existingPerson.firstName}_v2`,
      middleName: `${existingPerson.firstName}_v2`,
      lastName: `${existingPerson.lastName}_v2`,
      preferredName: '',
      birthdate: '1980-12-31',
      googlePhotoUrl: '',
      notes: [{
        note: 'Some text',
        date: '2021-03-16',
      }],
      photos: [],
      picasaContactId: '',
      tags: [tag._id],
    };

    numPeopleStart = await Person.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingPerson._id}`).send(person);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the updated person.', async () => {
    expect(res.body.data._id).toBe(existingPerson._id.toString());
    expect(JSON.stringify(res.body.data.tags)).toBe(JSON.stringify(person.tags));
    expect(res.body.data.firstName).toBe(person.firstName);
    expect(res.body.data.middleName).toBe(person.middleName);
    expect(res.body.data.lastName).toBe(person.lastName);
    expect(res.body.data.preferredName).toBe(person.preferredName);
    expect(new Date(res.body.data.birthdate)).toStrictEqual(new Date(person.birthdate));
    expect(res.body.data.googlePhotoUrl).toBe(person.googlePhotoUrl);
    expect(miscHelper.arePersonNotesEqual(res.body.data.notes, person.notes)).toBe(true);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);
  });

  test('The changes to the updated person persist via a call to GET.', async () => {
    res = await request(app).get(`${rootUrl}/${existingPerson._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data._id).toBe(existingPerson._id.toString());
    expect(res.body.data.firstName).toBe(person.firstName);
    expect(res.body.data.middleName).toBe(person.middleName);
    expect(res.body.data.lastName).toBe(person.lastName);
    expect(res.body.data.preferredName).toBe(person.preferredName);
    expect(new Date(res.body.data.birthdate)).toStrictEqual(new Date(person.birthdate));
    expect(res.body.data.googlePhotoUrl).toBe(person.googlePhotoUrl);
    expect(miscHelper.arePersonNotesEqual(res.body.data.notes, person.notes)).toBe(true);
    expect(res.body.data.picasaContactId).toBe(person.picasaContactId);
    expect(JSON.stringify(res.body.data.photos)).toBe(JSON.stringify(person.photos));
    expect(miscHelper.IsDateEqualish(new Date(res.body.data.createdAt), new Date())).toBe(false);
    expect(res.body.data.updatedAt > res.body.data.createdAt).toBe(true);

    const resBodyTags = res.body.data.tags.map((tag) => tag._id);
    expect(JSON.stringify(resBodyTags)).toBe(JSON.stringify(person.tags));
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Update (put) an existing person with a duplicate name.', () => {
  let res;
  let numPeopleStart;
  let person;

  test('The HTTP response status and body should indicate failure.', async () => {
    const existingPerson1 = await Person.findOne({ firstName: 'John', lastName: 'Doe' });
    const existingPerson2 = await Person.findOne({ firstName: 'Janet', lastName: 'Doe' });
    const tag = await Tag.findOne({ isPerson: true });

    person = {
      _id: existingPerson1._id,
      firstName: existingPerson2.firstName,
      middleName: existingPerson2.middleName,
      lastName: existingPerson2.lastName,
      preferredName: '',
      googlePhotoUrl: '',
      notes: [],
      photos: [],
      picasaContactId: '',
      tags: [tag._id],
    };

    numPeopleStart = await Person.countDocuments();

    res = await request(app).put(`${rootUrl}/${person._id}`).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A person called '${existingPerson2.name}' already exists.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(JSON.stringify(res.body.data)).toStrictEqual(JSON.stringify(person));
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Update (put) an existing person with an invalid tag.', () => {
  let res;
  let numPeopleStart;
  let existingPerson;
  let person;

  test('The HTTP response status and body should indicate failure.', async () => {
    existingPerson = await Person.findOne({ firstName: 'John', lastName: 'Doe' });

    const tmpTags = await Tag.find({ isPerson: false }, 'name').limit(2);
    const nonPersonTags = tmpTags.map((tag) => tag._id);

    person = {
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

    res = await request(app).put(`${rootUrl}/${existingPerson._id}`).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Invalid tag(s): ${nonPersonTags.join(', ')}.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(JSON.stringify(res.body.data)).toBe(JSON.stringify(person));
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Update (put) an existing person with other invalid properties.', () => {
  let res;
  let numPeopleStart;
  let existingPerson;
  let person;

  test('The HTTP response status and body should indicate failure.', async () => {
    existingPerson = await Person.findOne({ firstName: 'John', lastName: 'Doe' });

    person = {
      firstName: undefined,
      lastName: 'A_name_longer_than_25_characters',
      preferredName: 1234,
      birthdate: '1950-09-31',
      googlePhotoUrl: undefined,
      notes: [{ note: '', date: '202-01-15' }],
      picasaContactId: '1234',
      tags: ['Biking'], // This gets picked up at a later stage.  See invalid tag test.
    };

    numPeopleStart = await Person.countDocuments();

    res = await request(app).put(`${rootUrl}/${existingPerson._id}`).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([
      {
        value: '',
        msg: 'First name is required; it must be between 1 and 25 characters long.',
        param: 'firstName',
        location: 'body',
      },
      {
        msg: 'Middle is required; it must be between 0 and 25 characters long.',
        param: 'middleName',
        location: 'body',
      },
      {
        value: 'A_name_longer_than_25_characters',
        msg: 'Last name is required; it must be between 0 and 25 characters long.',
        param: 'lastName',
        location: 'body',
      },
      {
        value: '1950-09-31',
        msg: 'Birthdate must be a valid date if it is specified.',
        param: 'birthdate',
        location: 'body',
      },
      {
        msg: 'A Google Photo URL is required; it must be between 0 and 250 characters long.',
        param: 'googlePhotoUrl',
        location: 'body',
      },
      {
        value: '1234',
        msg: 'A Picasa Contact ID is required; it can be an empty string or a 16-character ID.',
        param: 'picasaContactId',
        location: 'body',
      },
      {
        value: '202-01-15',
        msg: 'A note date must be a valid date.',
        param: 'notes[0].date',
        location: 'body',
      },
      {
        value: '',
        msg: 'A note is required.',
        param: 'notes[0].note',
        location: 'body',
      },
      {
        msg: 'Photos must be specified in an array; an empty array is okay.',
        param: 'photos',
        location: 'body',
      },
    ]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual({
      lastName: 'A_name_longer_than_25_characters',
      preferredName: '1234',
      birthdate: '1950-09-31',
      notes: [{ note: '', date: '202-01-15' }],
      picasaContactId: '1234',
      tags: ['Biking'],
      firstName: '',
      middleName: '',
      googlePhotoUrl: '',
    });
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Update (put) a non-existing person with valid data.', () => {
  let res;
  let numPeopleStart;
  let existingPerson;
  let person;

  test('The HTTP response status and body should indicate error.', async () => {
    existingPerson = await Person.findOne({ firstName: 'Janet', lastName: 'Doe' });
    const tag = await Tag.findOne({ isPerson: true });

    person = {
      firstName: `${existingPerson.firstName}_v2`,
      middleName: `${existingPerson.firstName}_v2`,
      lastName: `${existingPerson.lastName}_v2`,
      preferredName: '',
      birthdate: '1980-12-31',
      googlePhotoUrl: '',
      notes: [{
        note: 'Some text',
        date: '2021-03-16',
      }],
      photos: [],
      picasaContactId: '',
      tags: [tag._id],
    };

    numPeopleStart = await Person.countDocuments();

    res = await request(app).put(`${rootUrl}/${seedData.nonExistentId}`).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`A person with ID '${seedData.nonExistentId}' does not exist.`]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(JSON.stringify(res.body.data)).toBe(JSON.stringify(person));
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Update (put) a non-existing person with invalid data.', () => {
  let res;
  let numPeopleStart;
  let existingPerson;
  let person;

  test('The HTTP response status and body should indicate error.', async () => {
    existingPerson = await Person.findOne({ firstName: 'Janet', lastName: 'Doe' });

    person = {
      firstName: `${existingPerson.firstName}_v2`,
      middleName: `${existingPerson.firstName}_v2`,
      lastName: `${existingPerson.lastName}_v2`,
      preferredName: '',
      birthdate: '1980-12-31',
      googlePhotoUrl: '',
      notes: [],
      picasaContactId: '',
      tags: ['Friend'],
    };

    numPeopleStart = await Person.countDocuments();

    res = await request(app).put(`${rootUrl}/${seedData.nonExistentId}`).send(person);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([{
      msg: 'Photos must be specified in an array; an empty array is okay.',
      param: 'photos',
      location: 'body',
    }]);
  });

  test('The data in the response body should match the request.', async () => {
    expect(res.body.data).toStrictEqual(person);
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Delete an existing, unused person.', () => {
  let res;
  let numPeopleStart;
  let person;

  test('The HTTP response status and body should indicate success.', async () => {
    person = await Person.findOne({ firstName: 'Janet', lastName: 'Doe' });

    numPeopleStart = await Person.countDocuments();

    res = await request(app).delete(`${rootUrl}/${person._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('The data in the response body should match the deleted tag.', async () => {
    expect(res.body.data._id).toBe(person._id.toString());
  });

  test('The number of people should decrease by one.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart - 1);
  });
});

describe('Delete an existing person that breaks referential integrity with a note.', () => {
  let res;
  let numPeopleStart;
  let person;

  test('The HTTP response status and body should indicate error.', async () => {
    // Find a person who is referenced in one or more notes.  We are using a
    // query instead of hard coding a person to make the test cases more
    // resilient to change.
    person = await Person.aggregate([
      {
        $lookup: {
          from: 'notes',
          foreignField: 'people',
          localField: '_id',
          as: 'notes',
        },
      },
      {
        $match: {
          notes: { $not: { $size: 0 } },
        },
      },
      {
        $addFields: {
          id: '$_id',
        },
      },
      {
        $limit: 1,
      },
    ]);

    [person] = person;
    const numReferences = person.notes.length;

    numPeopleStart = await Person.countDocuments();

    res = await request(app).delete(`${rootUrl}/${person._id}`);
    expect(res.statusCode).toBe(422);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Cannot delete person with ID '${person._id}' without breaking referential integrity.  The person is referenced in: ${numReferences} notes.people field(s).`]);
    expect(1).toBe(1);
  });

  test('The data in the response body should match the requested person ID.', async () => {
    expect(res.body.data).toBe(person._id.toString());
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

describe('Delete a non-existing person.', () => {
  let res;
  let numPeopleStart;

  test('The HTTP response status and body should indicate error.', async () => {
    numPeopleStart = await Person.countDocuments();

    res = await request(app).delete(`${rootUrl}/${seedData.nonExistentId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.messages).toStrictEqual([`Could not find a person with ID '${seedData.nonExistentId}'.`]);
  });

  test('The data in the response body should match the non-existent person ID.', async () => {
    expect(res.body.data).toBe(seedData.nonExistentId);
  });

  test('The number of people should not have changed.', async () => {
    res = await request(app).get(`${rootUrl}/count`);
    expect(res.body.data).toBe(numPeopleStart);
  });
});

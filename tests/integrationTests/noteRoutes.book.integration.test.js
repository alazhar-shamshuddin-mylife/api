/**
 * This file contains integration tests for all REST API routes related
 * to book notes (i.e., /api/notes*).
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
const BookNote = require('../../models/book');
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
      photoAlbum: '',
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

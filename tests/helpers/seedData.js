/**
 * This file seeds (creates) MyLife data for the integration tests.
 *
 * @author Alazhar Shamshuddin.
 */

const BikeRide = require('../../models/bikeRide');
const Book = require('../../models/book');
const Note = require('../../models/note');
const Person = require('../../models/person');
const Tag = require('../../models/tag');
const Workout = require('../../models/workout');

const nonExistentId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
let seededTags;
let seededPeople;
let seededNotes;

/**
 * Removes all MyLife records from the people, notes and tags collections to
 * to provide a clean MyLife DB.
 */
async function removeData() {
  await Person.deleteMany({});
  await Note.deleteMany({});
  await Tag.deleteMany({});
}

/**
 * Seeds the MyLife database (the people, notes, and tags collections) for
 * integration testing purposes.
 *
 * Note that this function first removes all existing records from the people,
 * notes, and tags collections.
 */
async function seedData() {
  await removeData();

  const tags = [
    // Types
    {
      name: 'Bike Ride',
      isType: true,
      isTag: false,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    {
      name: 'Book',
      isType: true,
      isTag: false,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    {
      name: 'Hike',
      isType: true,
      isTag: false,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    {
      name: 'Health',
      isType: true,
      isTag: false,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    {
      name: 'Life',
      isType: true,
      isTag: false,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    {
      name: 'Workout',
      isType: true,
      isTag: false,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    // Workouts
    {
      name: 'Grouse Grind',
      isType: false,
      isTag: false,
      isWorkout: true,
      isPerson: false,
      description: '',
    },
    // Tags
    {
      name: 'Biking',
      isType: false,
      isTag: true,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    {
      name: 'Exploring',
      isType: false,
      isTag: true,
      isWorkout: false,
      isPerson: false,
      description: '',
    },
    // People
    {
      name: 'Family',
      isType: false,
      isTag: false,
      isWorkout: false,
      isPerson: true,
      description: '',
    },
    {
      name: 'Friend',
      isType: false,
      isTag: false,
      isWorkout: false,
      isPerson: true,
      description: '',
    },
  ];

  seededTags = await Tag.insertMany(tags);

  const tagBook = await Tag.findOne({ name: 'Book' });
  const tagBikeRide = await Tag.findOne({ name: 'Bike Ride' });
  const tagWorkout = await Tag.findOne({ name: 'Workout' });
  const tagGrouseGrind = await Tag.findOne({ name: 'Grouse Grind' });
  const tagBiking = await Tag.findOne({ name: 'Biking' });
  const tagExploring = await Tag.findOne({ name: 'Exploring' });
  const tagFamily = await Tag.findOne({ name: 'Family' });

  const people = [
    {
      firstName: 'John',
      middleName: '',
      lastName: 'Doe',
      preferredName: '',
      birthdate: '1990-01-01',
      googlePhotoUrl: '',
      notes: [
        {
          note: 'This is the first example note.',
          date: '2021-03-19T22:07:52.392-07:00',
        },
        {
          note: 'This is the second (2nd) example note.',
          date: '2021-03-19T22:07:52.392-07:00',
        },
      ],
      photos: [],
      picasaContactId: '',
      tags: [tagFamily.id],
    },
    {
      firstName: 'Janet',
      middleName: 'Mary',
      lastName: 'Doe',
      preferredName: 'Jane',
      birthdate: '1990-01-01',
      googlePhotoUrl: '',
      notes: [
        {
          note: 'This is the first example note.',
          date: '2021-03-19T22:07:52.392-07:00',
        },
        {
          note: 'This is the second (2nd) example note.',
          date: '2021-03-19T22:07:52.392-07:00',
        },
      ],
      photos: [],
      picasaContactId: '',
      tags: [tagFamily.id],
    },
  ];
  seededPeople = await Person.insertMany(people);

  const personJohnDoe = await Person.findOne({ firstName: 'John', lastName: 'Doe' });

  const book = {
    type: tagBook.id,
    tags: [],
    date: '2020-09-12T17:00:00.000-07:00',
    title: 'Quidditch Through the Ages',
    description: 'Completed on Sun.Sep.13.2020.',
    people: [],
    place: '',
    authors: [
      'J. K. Rowling',
    ],
    status: 'Completed',
  };
  await Book.create(book);

  const bikeRide = {
    type: tagBikeRide.id,
    tags: [
      tagBiking.id,
      tagExploring.id,
    ],
    date: '2018-06-11T17:00:00.000-07:00',
    title: 'Day 1 of 109: Delta, BC to Chilliwack, BC',
    description: "Odometer Start: 91.07\nToday's Riding Distance: 91.07\nAverage Daily Distance: 91.07\nStart Time: 9:47\nEnd Time: 16:50\nNotes: \nAccommodation: Home - Friend",
    people: [],
    place: '',
    metrics: [
      {
        dataSource: 'Bell F20 Bike Computer',
        startDate: '2018-06-11T17:00:00.000-07:00',
        distance: 91.07,
        movingTime: 19080,
        totalTime: 25380,
        avgSpeed: 17.5,
        maxSpeed: 53.6,
        elevationGain: 694,
        maxElevation: 127,
      },
    ],
    bike: 'MEC National 2018',
  };
  await BikeRide.create(bikeRide);

  const workout = {
    type: tagWorkout.id,
    tags: [],
    date: '2006-05-17T17:00:00.000-07:00',
    title: 'Hiking Grouse Grind',
    description: 'Grouse Grind with John Doe',
    people: [personJohnDoe.id],
    place: 'Grouse Mountain, North Vancouver, BC, Canada',
    metrics: [
      {
        property: 'duration',
        value: 3420,
      },
      {
        property: 'cost',
        value: '5.00',
      },
    ],
    workout: tagGrouseGrind.id,
  };
  await Workout.create(workout);

  seededNotes = await Note.find();

  return { seededTags, seededNotes, seededPeople };
}

module.exports = {
  nonExistentId,
  seedData,
};

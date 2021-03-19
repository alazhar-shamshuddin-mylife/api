const tags = [
  // Types
  {
    name: 'Bike Ride', isType: true, isTag: false, isWorkout: false, isPerson: false, description: '',
  },
  {
    name: 'Book', isType: true, isTag: false, isWorkout: false, isPerson: false, description: '',
  },
  {
    name: 'Hike', isType: true, isTag: false, isWorkout: false, isPerson: false, description: '',
  },
  {
    name: 'Health', isType: true, isTag: false, isWorkout: false, isPerson: false, description: '',
  },
  {
    name: 'Life', isType: true, isTag: false, isWorkout: false, isPerson: false, description: '',
  },
  {
    name: 'Workout', isType: true, isTag: false, isWorkout: false, isPerson: false, description: '',
  },
  // Workouts
  {
    name: 'Grouse Grind', isType: false, isTag: false, isWorkout: true, isPerson: false, description: '',
  },
  // Tags
  {
    name: 'Biking', isType: false, isTag: true, isWorkout: false, isPerson: false, description: '',
  },
  {
    name: 'Celebrating', isType: false, isTag: true, isWorkout: false, isPerson: false, description: '',
  },
  // People
  {
    name: 'Family', isType: false, isTag: false, isWorkout: false, isPerson: true, description: '',
  },
  {
    name: 'Friend', isType: false, isTag: false, isWorkout: false, isPerson: true, description: '',
  },
];

const notes = [{
  type: 'Book',
  tags: ['Hike', 'Hike', 'Book'],
  date: '    2020-12-29   ',
  title: 'A Story Book',
  authors: ['John Boyne', 'Margaret Atwood'],
  description: 'Test01',
  people: [],
  place: '',
  status: 'AbandonedXX',
  format: 'Audiobook',
  rating: 1,
  foobar: 'hello',
}];

module.exports = {
  tags,
};

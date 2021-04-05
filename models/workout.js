const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const workoutSchema = new Schema({
  workout: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  metrics: [{
    property: { type: String, required: true, minLength: 1, maxLength: 25 },
    value: { type: Schema.Types.Mixed, required: true },
  }],
});

workoutSchema
  .virtual('url')
  .get(() => `/notes/workouts/${this._id}`);

module.exports = Note.discriminator('Workout', workoutSchema);

const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const workoutSchema = new Schema({
  workout: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  metrics: [{
    property: { type: String, required: true, min: 1, max: 25 },
    value: { type: Schema.Types.Mixed, required: true },
  }],
});

workoutSchema
  .virtual('url')
  .get(() => `/note/workout/${this._id}`);

module.exports = Note.discriminator('Workout', workoutSchema);

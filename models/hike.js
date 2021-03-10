const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const hikeSchema = new Schema({
  metrics: [{
    startTime: { type: Date, required: false },
    totalTime: { type: Number, required: false, min: 0 },
    distance: { type: Number, required: false, min: 0 },
    elevationGain: { type: Number, required: false },
    maxElevation: { type: Number, required: false },
    route: {},
  }],
});

hikeSchema
  .virtual('url')
  .get(function() {
    return `/note/hike/${this._id}`;
  });

module.exports = Note.discriminator('Hike', hikeSchema);

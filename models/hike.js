const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const hikeSchema = new Schema({
  metrics: [{
    dataSource: { type: String, required: false, maxLength: 100 },
    startDate: { type: Date, required: false },
    movingTime: { type: Number, required: false, min: 0 },
    totalTime: { type: Number, required: false, min: 0 },
    distance: { type: Number, required: false, min: 0 },
    avgSpeed: { type: Number, required: false, min: 0 },
    maxSpeed: { type: Number, required: false, min: 0 },
    elevationGain: { type: Number, required: false },
    maxElevation: { type: Number, required: false },
    route: {},
  }],
});

hikeSchema
  .virtual('url')
  .get(function() {
    return `/notes/hikes/${this._id}`;
  });

module.exports = Note.discriminator('Hike', hikeSchema);

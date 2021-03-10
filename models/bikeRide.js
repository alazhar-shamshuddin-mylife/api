const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const bikeRideSchema = new Schema({
  bike: { type: String, required: true, enum: ['MEC National 2018'] },
  metrics: [{
    dataSource: { type: String, required: false, enum: ['Bell F20 Bike Computer', 'Strava'] },
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

bikeRideSchema
  .virtual('url')
  .get(function() {
    return `/note/bikeride/${this._id}`;
  });

module.exports = Note.discriminator('Bike Ride', bikeRideSchema);

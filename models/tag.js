const mongoose = require('mongoose');
const moment = require('moment');
const common = require('./common');

const { Schema } = mongoose;

const tagSchema = new Schema({
  name: { type: String, required: true, maxlength: 25 },
  description: { type: String, requird: false },
  image: { type: Buffer, required: false },
  isType: { type: Boolean, required: true },
  isTag: { type: Boolean, required: true },
  isWorkout: { type: Boolean, required: true },
  isPerson: { type: Boolean, required: true },
},
{
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toObject: { virtuals: true },
});

tagSchema
  .virtual('dateCreated')
  .get(function() {
    return moment(this.created).format(common.dateFormat);
  });

tagSchema
  .virtual('dateUpdated')
  .get(function() {
    return moment(this.updated).format(common.dateFormat);
  });

// Virtual for book's URL
tagSchema
  .virtual('url')
  .get(function() {
    return `/tag/${this._id}`;
  });

module.exports = mongoose.model('Tag', tagSchema);

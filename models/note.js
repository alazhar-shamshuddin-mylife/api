const mongoose = require('mongoose');
const moment = require('moment');
const common = require('./common');

const { Schema } = mongoose;

const noteSchema = new Schema({
  type: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', required: false }],
  date: { type: Date, required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, required: false },
  people: [{ type: Schema.Types.ObjectId, ref: 'Person', required: false }],
  place: { type: String, required: false },
  photoAlbum: { type: String, required: false },
},
{
  discriminatorKey: '_type',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toObject: { virtuals: true },
});

noteSchema
  .virtual('dateCreated')
  .get(function() {
    return moment(this.created).format(common.dateFormat);
  });

noteSchema
  .virtual('dateUpdated')
  .get(function() {
    return moment(this.updated).format(common.dateFormat);
  });

noteSchema
  .virtual('noteDate')
  .get(function() {
    return moment(this.date).format(common.dateFormat);
  });

noteSchema
  .virtual('url')
  .get(function() {
    return `/notes/${this._id}`;
  });

module.exports = mongoose.model('Note', noteSchema);

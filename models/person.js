const mongoose = require('mongoose');
const moment = require('moment');
const common = require('./common');

const { Schema } = mongoose;

const personSchema = new Schema({
  firstName: { type: String, required: true, minLength: 1, maxLength: 25 },
  middleName: { type: String, required: false, maxLength: 25 },
  lastName: { type: String, required: false, maxLength: 25 },
  preferredName: { type: String, required: false, maxLength: 25 },
  birthdate: { type: Date, required: false },
  googlePhotoUrl: { type: String, required: false, maxLength: 250 },
  picasaContactId: { type: String, required: false, maxLength: 16 },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', required: true }],
  notes: [{
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, required: true },
  }],
  photos: [{
    description: { type: String, required: false },
    image: { type: Buffer, required: true },
  }],
},
{
  collection: 'people',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toObject: { virtuals: true },
});

personSchema.index({ firstName: 1, middleName: 1, lastName: 1 }, { unique: true });

personSchema
  .virtual('name')
  .get(function() {
    let name = `${this.firstName}`;

    if (this.preferredName && this.preferredName.length > 0) {
      name = `${name} (${this.preferredName})`;
    }

    if (this.middleName) {
      if (this.middleName.length === 1) {
        name = `${name} ${this.middleName}.`;
      }
      else {
        name = `${name} ${this.middleName}`;
      }
    }

    name = `${name} ${this.lastName}`;

    return name;
  });

personSchema
  .virtual('dateCreated')
  .get(function() {
    return moment(this.created).format(common.dateFormat);
  });

personSchema
  .virtual('dateUpdated')
  .get(function() {
    return moment(this.updated).format(common.dateFormat);
  });

personSchema
  .virtual('url')
  .get(function() {
    return `/people/${this._id}`;
  });

module.exports = mongoose.model('Person', personSchema);

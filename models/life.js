const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const lifeSchema = new Schema({});

lifeSchema
  .virtual('url')
  .get(function() {
    return `/notes/life/${this._id}`;
  });

module.exports = Note.discriminator('Life', lifeSchema);

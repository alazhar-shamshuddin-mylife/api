const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const healthSchema = new Schema({});

healthSchema
  .virtual('url')
  .get(function() {
     return `/notes/health/${this._id}`;
  });

module.exports = Note.discriminator('Health', healthSchema);

const mongoose = require('mongoose');
const Note = require('./note');

const { Schema } = mongoose;

const bookSchema = new Schema({
  authors: [{ type: String, required: true, maxLength: 100 }],
  format: { type: String, required: false, enum: ['Book', 'eBook', 'Audiobook'] },
  status: { type: String, required: true, enum: ['Completed', 'Abandoned'] },
  rating: { type: Number, required: false, min: 1, max: 10 },
});

bookSchema
  .virtual('url')
  .get(function() {
    return `/notes/books/${this._id}`;
  });

module.exports = Note.discriminator('Book', bookSchema);

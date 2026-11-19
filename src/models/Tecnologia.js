const mongoose = require('mongoose');
const tecnologiaSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, maxlength: 100 },
  base: { type: String, required: true, trim: true, maxlength: 100 },
  // Tempo medio estimado para proficiencia, expresso em meses.
  curvaAprendizado: { type: Number, required: true, min: 1, max: 240 }
}, { versionKey: false });
module.exports = mongoose.model('Tecnologia', tecnologiaSchema, 'tecnologias');

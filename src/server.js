require('dotenv').config();
const express = require('express');
const path = require('node:path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Tecnologia = require('./models/Tecnologia');
const connectDatabase = require('./config/database');
const verificarToken = require('./middlewares/auth');

const app = express();
const PORT = Number(process.env.PORT || 3003);
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function validarTecnologia(corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return { erro: 'Envie um objeto JSON.' };
  }
  const { nome, base, curvaAprendizado } = corpo;
  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 100 ||
      typeof base !== 'string' || !base.trim() || base.trim().length > 100) {
    return { erro: 'Nome e base são obrigatórios e devem ter no máximo 100 caracteres.' };
  }
  if (typeof curvaAprendizado !== 'number' || !Number.isInteger(curvaAprendizado) ||
      curvaAprendizado < 1 || curvaAprendizado > 240) {
    return { erro: 'Curva de aprendizado deve ser um número inteiro de meses, de 1 a 240.' };
  }
  return { dados: { nome: nome.trim(), base: base.trim(), curvaAprendizado } };
}

function tratarErro(res, erro, mensagem) {
  if (erro.name === 'ValidationError' || erro.name === 'CastError') {
    return res.status(400).json({ mensagem: 'Dados inválidos.', detalhe: erro.message });
  }
  console.error(mensagem, erro.message);
  return res.status(500).json({ mensagem });
}

app.post('/login', (req, res) => {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    return res.status(503).json({ mensagem: 'Autenticação não configurada no .env.' });
  }
  const { usuario, senha } = req.body || {};
  if (usuario !== process.env.ADMIN_USER || senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
  }
  return res.json({
    token: jwt.sign({ usuario }, process.env.JWT_SECRET, {
      algorithm: 'HS256', expiresIn: '1h'
    })
  });
});

app.get('/tecnologias', async (req, res) => {
  try {
    return res.json(await Tecnologia.find().sort({ nome: 1 }));
  } catch (erro) { return tratarErro(res, erro, 'Erro ao listar tecnologias.'); }
});

app.get('/tecnologias/:id', async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  try {
    const tecnologia = await Tecnologia.findById(req.params.id);
    if (!tecnologia) return res.status(404).json({ mensagem: 'Tecnologia não encontrada.' });
    return res.json(tecnologia);
  } catch (erro) { return tratarErro(res, erro, 'Erro ao consultar tecnologia.'); }
});

app.post('/tecnologias', verificarToken, async (req, res) => {
  const dados = validarTecnologia(req.body);
  if (dados.erro) return res.status(400).json({ mensagem: dados.erro });
  try {
    return res.status(201).json(await Tecnologia.create(dados.dados));
  } catch (erro) { return tratarErro(res, erro, 'Erro ao cadastrar tecnologia.'); }
});

app.put('/tecnologias/:id', verificarToken, async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  const dados = validarTecnologia(req.body);
  if (dados.erro) return res.status(400).json({ mensagem: dados.erro });
  try {
    const tecnologia = await Tecnologia.findByIdAndUpdate(
      req.params.id, dados.dados, { returnDocument: 'after', runValidators: true }
    );
    if (!tecnologia) return res.status(404).json({ mensagem: 'Tecnologia não encontrada.' });
    return res.json(tecnologia);
  } catch (erro) { return tratarErro(res, erro, 'Erro ao atualizar tecnologia.'); }
});

app.delete('/tecnologias/:id', verificarToken, async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  try {
    const tecnologia = await Tecnologia.findByIdAndDelete(req.params.id);
    if (!tecnologia) return res.status(404).json({ mensagem: 'Tecnologia não encontrada.' });
    return res.json({ mensagem: 'Tecnologia excluída com sucesso.' });
  } catch (erro) { return tratarErro(res, erro, 'Erro ao excluir tecnologia.'); }
});

app.use((erro, req, res, next) => {
  if (erro && erro.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'JSON inválido.' });
  }
  console.error('Erro inesperado:', erro?.message);
  return res.status(500).json({ mensagem: 'Erro interno.' });
});

async function iniciarServidor() {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT inválida.');
  if (!process.env.MONGO_URL || !process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    throw new Error('Configure MONGO_URL, ADMIN_USER, ADMIN_PASSWORD e JWT_SECRET no .env.');
  }
  await connectDatabase();
  return app.listen(PORT, () => console.log('Servidor iniciado em http://localhost:' + PORT));
}
if (require.main === module) iniciarServidor().catch(erro => {
  console.error('Falha ao iniciar API:', erro.message);
  process.exitCode = 1;
});
module.exports = { app, iniciarServidor, validarTecnologia };

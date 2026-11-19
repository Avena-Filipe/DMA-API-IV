const { test, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
process.env.ADMIN_USER = 'usuario-teste';
process.env.ADMIN_PASSWORD = 'senha-teste';
process.env.JWT_SECRET = 'chave-local-de-testes-automatizados-123456789';
const { app, validarTecnologia } = require('../src/server');
const Tecnologia = require('../src/models/Tecnologia');
const id = '507f1f77bcf86cd799439011';
let servidor;
let base;
before(async () => {
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  base = 'http://127.0.0.1:' + servidor.address().port;
});
after(async () => { if (servidor) await new Promise(resolve => servidor.close(resolve)); });
async function requisitar(rota, method = 'GET', body, token) {
  const res = await fetch(base + rota, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
async function login() {
  const r = await requisitar('/login', 'POST', { usuario: 'usuario-teste', senha: 'senha-teste' });
  assert.equal(r.status, 200);
  assert.ok(r.json.token);
  return r.json.token;
}
const exemplo = { nome: 'React', base: 'JavaScript', curvaAprendizado: 6 };
test('Validação exige nome, base e meses inteiros', () => {
  assert.ok(validarTecnologia(exemplo).dados);
  assert.ok(validarTecnologia({ ...exemplo, base: '' }).erro);
  assert.ok(validarTecnologia({ ...exemplo, curvaAprendizado: 'seis' }).erro);
  assert.ok(validarTecnologia({ ...exemplo, curvaAprendizado: 0 }).erro);
});
test('GET / apresenta formulário HTML', async () => {
  const r = await fetch(base + '/');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Cadastro de tecnologias/);
});
test('Login retorna token e rejeita senha incorreta', async () => {
  assert.equal((await requisitar('/login','POST',{ usuario:'usuario-teste',senha:'errada' })).status,401);
  assert.ok(await login());
});
test('POST, PUT e DELETE requerem token', async () => {
  assert.equal((await requisitar('/tecnologias','POST',exemplo)).status,401);
  assert.equal((await requisitar('/tecnologias/'+id,'PUT',exemplo)).status,401);
  assert.equal((await requisitar('/tecnologias/'+id,'DELETE')).status,401);
  assert.equal((await requisitar('/tecnologias','POST',exemplo,'token-invalido')).status,401);
});
test('GET lista dados do banco', async () => {
  const stub = mock.method(Tecnologia,'find',() => ({ sort: async () => [{ _id:id, ...exemplo }] }));
  try {
    const r = await requisitar('/tecnologias');
    assert.equal(r.status,200);
    assert.equal(r.json[0].nome,'React');
  } finally { stub.mock.restore(); }
});
test('GET por id retorna registro', async () => {
  const stub = mock.method(Tecnologia,'findById',async () => ({_id:id,...exemplo}));
  try { assert.equal((await requisitar('/tecnologias/'+id)).status,200); }
  finally { stub.mock.restore(); }
});
test('POST cria registro válido e rejeita dados inválidos', async () => {
  const token = await login();
  const stub = mock.method(Tecnologia,'create',async dados => ({_id:id,...dados}));
  try {
    const r = await requisitar('/tecnologias','POST',exemplo,token);
    assert.equal(r.status,201);
    assert.equal(r.json.curvaAprendizado,6);
    assert.equal((await requisitar('/tecnologias','POST',{...exemplo,base:''},token)).status,400);
  } finally { stub.mock.restore(); }
});
test('PUT altera registro pelo _id', async () => {
  const token = await login();
  const stub = mock.method(Tecnologia,'findByIdAndUpdate',async (i,dados) => ({_id:i,...dados}));
  try {
    const r = await requisitar('/tecnologias/'+id,'PUT',{...exemplo,curvaAprendizado:8},token);
    assert.equal(r.status,200);
    assert.equal(r.json.curvaAprendizado,8);
  } finally { stub.mock.restore(); }
});
test('DELETE remove registro pelo _id', async () => {
  const token = await login();
  const stub = mock.method(Tecnologia,'findByIdAndDelete',async () => ({_id:id}));
  try { assert.equal((await requisitar('/tecnologias/'+id,'DELETE',undefined,token)).status,200); }
  finally { stub.mock.restore(); }
});
test('ID inválido retorna 400', async () => {
  assert.equal((await requisitar('/tecnologias/invalido','GET')).status,400);
  assert.equal((await requisitar('/tecnologias/invalido','DELETE',undefined,await login())).status,400);
});
test('ID não encontrado retorna 404', async () => {
  const stub = mock.method(Tecnologia,'findById',async () => null);
  try { assert.equal((await requisitar('/tecnologias/'+id)).status,404); }
  finally { stub.mock.restore(); }
});

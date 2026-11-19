'use strict';
let token = '';
let tecnologias = [];
const ids = ['statusLogin','mensagem','formLogin','formTecnologia','usuario','senha','nome','base','curvaAprendizado','tecnologiaId','salvar','listaTecnologias'];
const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

function informar(texto, tipo = '') {
  el.mensagem.textContent = texto;
  el.mensagem.className = tipo;
}
function atualizarAutenticacao() {
  el.statusLogin.textContent = token ? 'Autenticado' : 'Não autenticado';
  el.statusLogin.classList.toggle('ativo', Boolean(token));
}
async function solicitar(rota, opcoes = {}) {
  const resposta = await fetch(rota, opcoes);
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    if (resposta.status === 401 && token) {
      token = '';
      atualizarAutenticacao();
    }
    throw new Error(dados.mensagem || 'Erro HTTP ' + resposta.status);
  }
  return dados;
}
function cabecalhos() {
  return { 'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}) };
}
function limparFormulario() {
  el.formTecnologia.reset();
  el.tecnologiaId.value = '';
  el.salvar.textContent = 'Cadastrar';
}
function editar(id) {
  const tecnologia = tecnologias.find(t => t._id === id);
  if (!tecnologia) return;
  el.tecnologiaId.value = tecnologia._id;
  el.nome.value = tecnologia.nome;
  el.base.value = tecnologia.base;
  el.curvaAprendizado.value = tecnologia.curvaAprendizado;
  el.salvar.textContent = 'Salvar alterações';
  el.nome.focus();
}
async function excluir(id) {
  if (!token) return informar('Faça login antes de excluir.', 'erro');
  if (!confirm('Deseja realmente excluir esta tecnologia?')) return;
  try {
    await solicitar('/tecnologias/' + encodeURIComponent(id), {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + token }
    });
    limparFormulario();
    await listar(false);
    informar('Tecnologia excluída.', 'sucesso');
  } catch (erro) { informar(erro.message, 'erro'); }
}
function td(linha, valor) {
  const coluna = document.createElement('td');
  coluna.textContent = String(valor ?? '');
  linha.appendChild(coluna);
}
async function listar(limparMensagem = true) {
  try {
    tecnologias = await solicitar('/tecnologias');
    el.listaTecnologias.replaceChildren();
    if (!tecnologias.length) {
      const linha = document.createElement('tr');
      const coluna = document.createElement('td');
      coluna.colSpan = 4;
      coluna.textContent = 'Nenhuma tecnologia cadastrada.';
      linha.appendChild(coluna);
      el.listaTecnologias.appendChild(linha);
    }
    for (const tecnologia of tecnologias) {
      const linha = document.createElement('tr');
      td(linha, tecnologia.nome);
      td(linha, tecnologia.base);
      td(linha, tecnologia.curvaAprendizado + ' meses');
      const acoes = document.createElement('td');
      acoes.className = 'acoes';
      const botaoEditar = document.createElement('button');
      botaoEditar.className = 'secondary small';
      botaoEditar.type = 'button';
      botaoEditar.textContent = 'Editar';
      botaoEditar.addEventListener('click', () => editar(tecnologia._id));
      const botaoExcluir = document.createElement('button');
      botaoExcluir.className = 'danger small';
      botaoExcluir.type = 'button';
      botaoExcluir.textContent = 'Excluir';
      botaoExcluir.addEventListener('click', () => excluir(tecnologia._id));
      acoes.append(botaoEditar, botaoExcluir);
      linha.appendChild(acoes);
      el.listaTecnologias.appendChild(linha);
    }
    if (limparMensagem) informar('');
  } catch (erro) { informar('Erro ao listar tecnologias: ' + erro.message, 'erro'); }
}
el.formLogin.addEventListener('submit', async evento => {
  evento.preventDefault();
  try {
    const dados = await solicitar('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: el.usuario.value, senha: el.senha.value })
    });
    token = dados.token;
    el.senha.value = '';
    atualizarAutenticacao();
    informar('Login realizado.', 'sucesso');
  } catch (erro) { informar(erro.message, 'erro'); }
});
el.formTecnologia.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (!token) return informar('Faça login antes de salvar.', 'erro');
  const id = el.tecnologiaId.value;
  const dados = {
    nome: el.nome.value.trim(),
    base: el.base.value.trim(),
    curvaAprendizado: Number(el.curvaAprendizado.value)
  };
  try {
    await solicitar(id ? '/tecnologias/' + encodeURIComponent(id) : '/tecnologias', {
      method: id ? 'PUT' : 'POST', headers: cabecalhos(),
      body: JSON.stringify(dados)
    });
    limparFormulario();
    await listar(false);
    informar('Tecnologia salva com sucesso.', 'sucesso');
  } catch (erro) { informar(erro.message, 'erro'); }
});
document.getElementById('cancelarEdicao').addEventListener('click', limparFormulario);
document.getElementById('recarregar').addEventListener('click', () => listar());
document.getElementById('sair').addEventListener('click', () => {
  token = ''; atualizarAutenticacao(); informar('Sessão encerrada.');
});
atualizarAutenticacao();
listar();

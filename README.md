# DMA-API-IV — API REST de Tecnologias de Programação

Projeto acadêmico ADS: cadastro de tecnologias de programação, com validação de token JWT, CRUD completo e interface HTML/CSS/JS com tabela.

## Requisitos

- `nome`: React, Vue, Node.js, Angular etc.
- `base`: linguagem-base, como JavaScript, PHP e C#.
- `curvaAprendizado`: **número inteiro de meses** estimados para proficiência (1 a 240).
- Login com JWT; token obrigatório para cadastrar, editar e excluir.
- Visualização dos registros em tabela no navegador.
- MongoDB Atlas com Mongoose.

Exemplo de corpo JSON:

```json
{
  "nome": "React",
  "base": "JavaScript",
  "curvaAprendizado": 6
}
```

A curva de aprendizado é informada pelo usuário e não representa uma estimativa objetiva universal.

## Como executar

1. Instale Node.js 22 e Git. Abra uma pasta e clone: `git clone https://github.com/Avena-Filipe/DMA-API-IV.git`
2. Entre na pasta: `cd DMA-API-IV`
3. Instale: `npm ci`
4. Copie `.env.example` para `.env` e configure `MONGO_URL`, `ADMIN_USER`, `ADMIN_PASSWORD` e `JWT_SECRET`. **Nunca publique seu arquivo .env.**
5. Rode `npm run check`, depois `npm test`.
6. Inicie com `npm start`.
7. Abra **http://localhost:3003/** e teste login, cadastro, listagem, atualização e exclusão.

O `.env.example` sugere `DB_NAME=tecnologias_programacao` para separar a aplicação do banco de alunos existente. Não é necessário criar outro cluster Atlas, somente usar as credenciais corretas e confirmar acesso à rede.

## Endpoints

| Método | Rota | JWT | Descrição |
| --- | --- | --- | --- |
| GET | / | Não | Frontend |
| POST | /login | Não | Retorna token com duração de 1 hora |
| GET | /tecnologias | Não | Lista tecnologias |
| GET | /tecnologias/:id | Não | Consulta por _id |
| POST | /tecnologias | Sim | Cadastra tecnologia |
| PUT | /tecnologias/:id | Sim | Atualiza |
| DELETE | /tecnologias/:id | Sim | Exclui |

Para rotas protegidas use o header `Authorization: Bearer SEU_TOKEN`.

## Postman e entrega

Importe `API-Tecnologias.postman_collection.json` no Postman e execute as requisições em ordem. Ajuste a senha do login para sua senha local; o token e o ID ficam guardados automaticamente nas variáveis da coleção.

No frontend, confirme: entrar → cadastrar React (base JavaScript, 6 meses) → ver tabela → editar a curva → excluir o registro.

A aba Actions do GitHub valida a instalação, a sintaxe e os testes automatizados com **mocks do Mongoose**. Esses testes não acessam o MongoDB real; valide também a conexão e as operações no Atlas antes de entregar.

**Segurança:** autenticação por usuário e senha de ambiente é didática. Para produção, seria necessário gerenciamento seguro de usuários e credenciais. Se sua senha do Atlas apareceu em commits antigos, substitua-a.

Este repositório é independente da API de Alunos e da versão anterior da cartilha.

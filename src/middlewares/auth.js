const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const autorizacao = req.headers.authorization;

  if (!autorizacao) {
    return res.status(401).json({ mensagem: 'Token nao informado.' });
  }

  const partes = autorizacao.match(/^Bearer\s+(\S+)$/i);
  if (!partes) {
    return res.status(401).json({ mensagem: 'Use Authorization: Bearer TOKEN.' });
  }

  try {
    req.usuario = jwt.verify(partes[1], process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
    next();
  } catch {
    return res.status(401).json({ mensagem: 'Token invalido ou expirado.' });
  }
}

module.exports = verificarToken;

import Fastify from 'fastify';
import { pool, initDatabase } from './database';

const fastify = Fastify({ logger: true });

interface FuncionarioBody {
  nome: string;
  cpf: string;
}

fastify.post('/funcionarios', async (request, reply) => {
  const { nome, cpf } = request.body as FuncionarioBody;
  if (!nome || !cpf) return reply.status(400).send({ error: 'Nome e CPF são obrigatórios.' });

  try {
    const result = await pool.query('INSERT INTO funcionarios (nome, cpf) VALUES ($1, $2) RETURNING *', [nome, cpf]);
    return reply.status(201).send(result.rows);
  } catch (error: any) {
    if (error.code === '23505') return reply.status(400).send({ error: 'CPF já cadastrado.' });
    return reply.status(500).send({ error: 'Erro interno do servidor.' });
  }
});

fastify.get('/funcionarios', async () => {
  const result = await pool.query('SELECT * FROM funcionarios');
  return result.rows;
});

fastify.put('/funcionarios/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { nome, cpf } = request.body as FuncionarioBody;
  const result = await pool.query('UPDATE funcionarios SET nome = $1, cpf = $2 WHERE id = $3 RETURNING *', [nome, cpf, id]);
  if (result.rowCount === 0) return reply.status(404).send({ error: 'Funcionário não encontrado.' });
  return result.rows;
});

fastify.delete('/funcionarios/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const result = await pool.query('DELETE FROM funcionarios WHERE id = $1 RETURNING *', [id]);
  if (result.rowCount === 0) return reply.status(404).send({ error: 'Funcionário não encontrado.' });
  return reply.status(204).send();
});

const start = async () => {
  try {
    await initDatabase();
    await fastify.listen({ host: '0.0.0.0', port: 3000 });
    console.log('Servidor rodando na porta 3000');
  } catch (err) {
    process.exit(1);
  }
};
start();

// api/assistente.js
// Função serverless da Vercel. Mantém a API key da Anthropic segura no servidor
// (nunca exposta no HTML/JS que roda no navegador do usuário).
//
// Configuração necessária no painel da Vercel:
//   Project Settings → Environment Variables → adicionar ANTHROPIC_API_KEY
//   (a chave de API da Anthropic, começa com "sk-ant-...")
// Depois disso, faça um novo deploy para a variável entrar em vigor.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'ANTHROPIC_API_KEY não configurada no servidor. Adicione a variável de ambiente no painel da Vercel e faça um novo deploy.'
    });
    return;
  }

  const { pergunta, contexto } = req.body || {};
  if (!pergunta || typeof pergunta !== 'string') {
    res.status(400).json({ error: 'Campo "pergunta" é obrigatório.' });
    return;
  }

  const systemPrompt = `Você é o Assistente IA do Síndico dentro do sistema NexCondo, um software de gestão condominial.
Responda de forma direta, objetiva e em português do Brasil, como um assistente financeiro e administrativo experiente falando com o síndico.
Use APENAS os dados fornecidos no contexto JSON abaixo. Nunca invente números.
Se a pergunta exigir um dado que não está no contexto, diga claramente que essa informação não está disponível no momento e sugira onde o síndico pode consultá-la no próprio sistema (ex: módulo de Contratos, Movimentações, etc).
Seja conciso: prefira respostas de 2 a 5 frases, com números formatados em Real (R$) quando aplicável.

Contexto atual do condomínio (dados reais, atualizados em ${contexto?.dataConsulta || 'hoje'}):
${JSON.stringify(contexto || {}, null, 2)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: pergunta }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro da API Anthropic:', response.status, errText);
      res.status(502).json({ error: 'Erro ao consultar a IA. Tente novamente em instantes.' });
      return;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const resposta = textBlock ? textBlock.text : 'Não consegui gerar uma resposta.';

    res.status(200).json({ resposta });
  } catch (err) {
    console.error('Erro no handler do assistente:', err);
    res.status(500).json({ error: 'Erro interno ao processar a pergunta.' });
  }
}

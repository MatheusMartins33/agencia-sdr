const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const SYNTHESIS_PROMPT = `
Você é um especialista em engenharia de prompts. Sua tarefa é analisar o texto bruto fornecido por um usuário sobre a empresa dele e sintetizá-lo em um parágrafo único, claro e conciso, que servirá de contexto para um outro agente de IA focado em vendas B2B.
O parágrafo deve ser inspirador e capturar a essência da marca.
Extraia e combine a missão, o tom de voz e os principais diferenciais.
Responda apenas com o parágrafo final, sem introduções ou despedidas.
`;

export async function synthesizeCompanyContext(rawText: string): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYNTHESIS_PROMPT },
        { role: "user", content: rawText }
      ],
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("OpenAI API error:", errorData);
    throw new Error("Falha ao otimizar o contexto com a IA.");
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
export const EXPECTED_HEADERS_PRODUTOS = [
  'id_produto',
  'nome_produto',
  'descricao',
  'quantidade',
  'preco_normal',
  'preco_promo',
  'link_foto',
  'validade_promo'
];

export const EXPECTED_HEADERS_CONTATOS = [
  'id_lead',
  'nome',
  'telefone',
  'email',
  'empresa',
  'segmento',
  'score',
  'status',
  'ultima_interacao'
];

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  missingColumns: string[];
  extraColumns: string[];
  wrongOrder: boolean;
};

export function validateHeaders(
  uploaded: string[],
  expected: string[]
): ValidationResult {
  const norm = uploaded.map(h => h.trim().toLowerCase());
  const exp = expected.map(h => h.toLowerCase());

  const missing = exp.filter(h => !norm.includes(h));
  const extra = norm.filter(h => !exp.includes(h));
  const wrongOrder = norm.join(',') !== exp.join(',');

  const errors: string[] = [];
  if (missing.length) {
    errors.push(`Colunas faltando: ${missing.join(', ')}`);
  }
  if (extra.length) {
    errors.push(`Colunas extras não permitidas: ${extra.join(', ')}`);
  }
  if (!missing.length && !extra.length && wrongOrder) {
    errors.push('Colunas fora de ordem. Use o template fornecido.');
  }

  return {
    valid: errors.length === 0,
    errors,
    missingColumns: missing,
    extraColumns: extra,
    wrongOrder: wrongOrder && !missing.length && !extra.length
  };
}

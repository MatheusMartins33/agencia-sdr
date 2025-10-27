import Papa from 'papaparse';
import { EXPECTED_HEADERS_PRODUTOS, EXPECTED_HEADERS_CONTATOS } from './validation';

function triggerDownload(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadProdutosTemplate() {
  const headers = EXPECTED_HEADERS_PRODUTOS;
  const data = [
    ['P001', 'Produto Exemplo', 'Descrição detalhada do produto', '10', '100.00', '80.00', '', '2025-12-31T23:59:59Z'],
    ['P002', 'Outro Produto', 'Outra descrição aqui', '5', '200.00', '', '', '']
  ];
  const csv = Papa.unparse({ fields: headers, data });
  triggerDownload(csv, 'template_produtos.csv');
}

export function downloadContatosTemplate() {
  const headers = EXPECTED_HEADERS_CONTATOS;
  const data = [
    ['L001', 'João Silva', '+5511999999999', 'joao@empresa.com', 'Empresa XYZ', 'Tecnologia', '0', 'novo', ''],
    ['L002', 'Maria Santos', '+5511988888888', 'maria@consultoria.com', 'Consultoria ABC', 'Consultoria', '0', 'novo', '']
  ];
  const csv = Papa.unparse({ fields: headers, data });
  triggerDownload(csv, 'template_contatos.csv');
}

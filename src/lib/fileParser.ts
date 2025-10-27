import Papa from 'papaparse';

export type ParsedFile = {
  headers: string[];
  rows: string[][];
  fileName: string;
  fileType: 'csv' | 'xlsx';
};

const MAX_FILE_SIZE_MB = 10;
const MAX_ROWS = 10000;

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }
  return { valid: true };
}

export function validateRowCount(rows: string[][]): { valid: boolean; error?: string } {
  if (rows.length > MAX_ROWS) {
    return {
      valid: false,
      error: `Arquivo excede o limite de ${MAX_ROWS.toLocaleString()} linhas. Total: ${rows.length.toLocaleString()} linhas`
    };
  }
  return { valid: true };
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) {
    throw new Error(sizeCheck.error);
  }

  const fileType = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx';

  if (fileType !== 'csv') {
    throw new Error('Formato não suportado. Use arquivos CSV (.csv)');
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const allRows = results.data as string[][];
        
        if (allRows.length === 0) {
          reject(new Error('Arquivo vazio'));
          return;
        }

        const headers = allRows[0];
        const rows = allRows.slice(1);

        const rowCheck = validateRowCount(rows);
        if (!rowCheck.valid) {
          reject(new Error(rowCheck.error));
          return;
        }

        resolve({
          headers,
          rows,
          fileName: file.name,
          fileType
        });
      },
      error: (error) => {
        reject(new Error(`Erro ao parsear arquivo: ${error.message}`));
      }
    });
  });
}

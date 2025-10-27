import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImportacao } from '@/hooks/useImportacao';
import { Upload, FileSpreadsheet, Users, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import { DiffCard } from '@/components/DiffCard';

// Helper types
type UploadType = 'produtos' | 'contatos';

const REQUIRED_COLUMNS: Record<UploadType, string[]> = {
  produtos: ['nome_produto', 'descricao', 'quantidade', 'preco_normal', 'preco_promo', 'link_foto', 'validade_promo'],
  contatos: ['nome', 'telefone', 'email', 'empresa', 'segmento', 'score', 'status', 'ultima_interacao'],
};

export default function Ingestao() {
  const { 
    dryRunProdutos, 
    confirmProdutos, 
    dryRunContatos, 
    confirmContatos 
  } = useImportacao();

  const [file, setFile] = useState<Record<UploadType, File | null>>({ produtos: null, contatos: null });
  const [rows, setRows] = useState<Record<UploadType, string[][] | null>>({ produtos: null, contatos: null });

  const getMutation = (type: UploadType, stage: 'dryRun' | 'confirm') => {
    if (type === 'produtos') return stage === 'dryRun' ? dryRunProdutos : confirmProdutos;
    return stage === 'dryRun' ? dryRunContatos : confirmContatos;
  };

  const handleFileParse = (selectedFile: File, type: UploadType) => {
    getMutation(type, 'dryRun').reset();
    getMutation(type, 'confirm').reset();
    setFile({ ...file, [type]: selectedFile });

    Papa.parse(selectedFile, {
      skipEmptyLines: true,
      complete: (result) => {
        const header = (result.data[0] as string[]) || [];
        const missingCols = REQUIRED_COLUMNS[type].filter(col => !header.includes(col));
        if (missingCols.length > 0) {
          getMutation(type, 'dryRun').mutate({} as any); // Trigger error state
          getMutation(type, 'dryRun').reset();
          alert(`Erro: Colunas obrigatórias faltando: ${missingCols.join(', ')}`);
          return;
        }
        setRows({ ...rows, [type]: result.data as string[][] });
        getMutation(type, 'dryRun').mutate({ rows: result.data as string[][], useQueryToken: true });
      },
      error: (err) => alert(`Erro ao processar CSV: ${err.message}`),
    });
  };

  const handleConfirm = (type: UploadType) => {
    const data = rows[type];
    if (!data) return;
    getMutation(type, 'confirm').mutate({ rows: data, useQueryToken: true });
  };

  const handleCancel = (type: UploadType) => {
    setFile({ ...file, [type]: null });
    setRows({ ...rows, [type]: null });
    getMutation(type, 'dryRun').reset();
    getMutation(type, 'confirm').reset();
  };

  const downloadTemplate = (type: UploadType) => {
    const csv = REQUIRED_COLUMNS[type].join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderImportCard = (type: UploadType) => {
    const mutation = getMutation(type, 'dryRun');
    const confirmMutation = getMutation(type, 'confirm');
    const Icon = type === 'produtos' ? FileSpreadsheet : Users;
    const title = type === 'produtos' ? 'Produtos' : 'Contatos';

    const isProcessing = mutation.isPending || confirmMutation.isPending;
    const isFinished = confirmMutation.isSuccess;

    if (isFinished) {
      return (
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <CardTitle>Importação Concluída!</CardTitle>
          <CardDescription className="mb-4">{confirmMutation.data?.message}</CardDescription>
          <Button onClick={() => handleCancel(type)}>Importar Novo Arquivo</Button>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5" />{title}</CardTitle>
          <CardDescription>Importe sua lista de {title.toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file[type] && (
            <>
              <Button variant="outline" className="w-full" onClick={() => downloadTemplate(type)}>Baixar Template</Button>
              <div className="relative">
                <input
                  type="file" accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileParse(e.target.files[0], type)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" id={`file-input-${type}`}
                  disabled={isProcessing}
                />
                <label htmlFor={`file-input-${type}`} className="w-full">
                  <Button className="w-full pointer-events-none">
                    <Upload className="mr-2 h-4 w-4" /> Fazer Upload
                  </Button>
                </label>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p>Processando, por favor aguarde...</p>
              <p className="text-sm text-muted-foreground">Validando dados e preparando para importação.</p>
            </div>
          )}

          {!isProcessing && mutation.isSuccess && (
            <>
              <DiffCard result={mutation.data} />
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => handleCancel(type)} className="flex-1">Cancelar</Button>
                <Button onClick={() => handleConfirm(type)} className="flex-1">Confirmar e Importar</Button>
              </div>
            </>
          )}

          {!isProcessing && mutation.isError && (
             <div className="flex flex-col items-center justify-center text-center p-6">
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <CardTitle>Erro na Validação</CardTitle>
              <AlertDescription className="mb-4">{mutation.error.message}</AlertDescription>
              <Button variant="outline" onClick={() => handleCancel(type)}>Tentar Novamente</Button>
            </div>
          )}

        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-16 border-b border-border bg-card px-6 flex items-center">
        <h2 className="text-lg font-semibold text-foreground">Importação de Dados</h2>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <Alert>
            <AlertDescription>
              <strong>Importante:</strong> Faça o upload de um arquivo CSV. O sistema irá validar os dados e apresentar uma prévia antes da importação final.
            </AlertDescription>
          </Alert>
          <div className="grid gap-6 md:grid-cols-2">
            {renderImportCard('produtos')}
            {renderImportCard('contatos')}
          </div>
        </div>
      </main>
    </div>
  );
}

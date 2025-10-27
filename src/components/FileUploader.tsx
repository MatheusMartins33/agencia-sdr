import { useCallback, useState } from "react";
import { Upload, Download, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { parseFile, ParsedFile } from "@/lib/fileParser";
import { validateHeaders, EXPECTED_HEADERS_PRODUTOS, EXPECTED_HEADERS_CONTATOS } from "@/lib/validation";
import { downloadProdutosTemplate, downloadContatosTemplate } from "@/lib/templateGenerator";

type FileUploaderProps = {
  type: "produtos" | "contatos";
  onFileValidated: (parsed: ParsedFile) => void;
};

export function FileUploader({ type, onFileValidated }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const expectedHeaders = type === "produtos" 
    ? EXPECTED_HEADERS_PRODUTOS 
    : EXPECTED_HEADERS_CONTATOS;

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const parsed = await parseFile(file);
      
      const validation = validateHeaders(parsed.headers, expectedHeaders);
      
      if (!validation.valid) {
        setError(validation.errors.join('\n'));
        setIsProcessing(false);
        return;
      }

      onFileValidated(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar arquivo");
    } finally {
      setIsProcessing(false);
    }
  }, [expectedHeaders, onFileValidated]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDownloadTemplate = () => {
    if (type === "produtos") {
      downloadProdutosTemplate();
    } else {
      downloadContatosTemplate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === "produtos" ? "📦 Upload de Produtos" : "👥 Upload de Contatos"}
        </CardTitle>
        <CardDescription>
          Baixe o template, preencha com seus dados e faça upload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleDownloadTemplate} variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Baixar Template .CSV
        </Button>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            className="hidden"
            id={`file-input-${type}`}
            disabled={isProcessing}
          />
          
          <div className="flex flex-col items-center gap-2">
            {isProcessing ? (
              <FileText className="w-12 h-12 text-muted-foreground animate-pulse" />
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground" />
            )}
            
            <p className="text-sm text-muted-foreground">
              {isProcessing ? "Processando arquivo..." : "Arraste o arquivo aqui ou"}
            </p>
            
            <label htmlFor={`file-input-${type}`}>
              <Button variant="secondary" size="sm" disabled={isProcessing} asChild>
                <span>Selecionar Arquivo</span>
              </Button>
            </label>
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            ⚠️ <strong>IMPORTANTE:</strong> Use EXATAMENTE o template fornecido. 
            Não altere as colunas nem a ordem.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

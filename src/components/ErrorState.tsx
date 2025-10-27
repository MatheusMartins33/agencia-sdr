import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar dados</AlertTitle>
        <AlertDescription>
          {message || "Ocorreu um erro ao buscar os dados. Tente novamente."}
        </AlertDescription>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="mt-4"
            size="sm"
          >
            Tentar novamente
          </Button>
        )}
      </Alert>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle } from "lucide-react";
import { createTenant } from "@/services/supabaseService";
import type { Step1TenantProps } from "@/types";

/**
 * Step 1 of the onboarding flow: collect a tenant name and create it
 * using the backend service. Displays error and success feedback to
 * the user and calls back once the tenant is created.
 */
export function Step1Tenant({ tenant, onTenantCreated }: Step1TenantProps) {
  const [tenantName, setTenantName] = useState(tenant?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!tenantName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newTenant = await createTenant(tenantName.trim());
      onTenantCreated(newTenant);
    } catch (err: any) {
      setError(
        "Falha ao criar a loja. Verifique se o nome já não está em uso."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Crie sua Loja</CardTitle>
        <CardDescription>
          Comece dando um nome para sua loja ou empresa. Este nome será usado
          para identificar seu ambiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tenantName">Nome da Loja</Label>
          <Input
            id="tenantName"
            placeholder="Ex: Flora Boutique"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            disabled={isLoading || !!tenant}
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {tenant && (
          <Alert variant="default" className="border border-green-100 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Loja Criada!</AlertTitle>
            <AlertDescription>
              Sua loja "{tenant.name}" está pronta. Você pode avançar para o
              próximo passo.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleCreate}
          disabled={!tenantName.trim() || isLoading || !!tenant}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tenant ? "Salvo" : "Salvar e Avançar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
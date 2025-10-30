import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Rocket } from "lucide-react";
import type { Step4FinalizeProps } from "@/types";

/**
 * Step 4 of the onboarding flow: final screen showing success and
 * providing a button to finalize and proceed to the dashboard. The
 * parent component manages the actual finalize action.
 */
export function Step4Finalize({ tenant, onFinalize }: Step4FinalizeProps) {
  const handleFinish = () => onFinalize(tenant.id);
  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Finalizar Configuração</CardTitle>
        <CardDescription>
          Seu ambiente está pronto! Clique em finalizar para acessar o painel de
          controle.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center p-8">
        <Rocket className="h-16 w-16 mx-auto text-green-500" />
        <p className="mt-4 text-lg font-semibold">
          Tudo pronto para decolar!
        </p>
        <p className="text-muted-foreground">
          Você completou todas as etapas necessárias.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleFinish}>Finalizar e ir para o Dashboard</Button>
      </CardFooter>
    </Card>
  );
}
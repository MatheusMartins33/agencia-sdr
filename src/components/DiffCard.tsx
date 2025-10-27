import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImportResponse } from "@/services/importer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type DiffCardProps = {
  result: ImportResponse;
};

export function DiffCard({ result }: DiffCardProps) {
  const createCount = result.to_create?.length || 0;
  const updateCount = result.to_update?.length || 0;
  const createSample = result.sample?.create_sample || [];
  const updateSample = result.sample?.update_sample || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultado da Validação</CardTitle>
        <CardDescription>
          Alterações que serão aplicadas ao confirmar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Badge variant="outline" className="text-sm">
            ✅ {createCount} novo(s)
          </Badge>
          <Badge variant="outline" className="text-sm">
            🔄 {updateCount} atualização(ões)
          </Badge>
        </div>

        {createSample.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Amostra - Novos registros:</h4>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(createSample[0]).map((key) => (
                      <TableHead key={key} className="whitespace-nowrap">
                        {key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {createSample.slice(0, 3).map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      {Object.values(item).map((value: any, cellIdx: number) => (
                        <TableCell key={cellIdx} className="whitespace-nowrap">
                          {String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {updateSample.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Amostra - Atualizações:</h4>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(updateSample[0]).map((key) => (
                      <TableHead key={key} className="whitespace-nowrap">
                        {key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updateSample.slice(0, 3).map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      {Object.values(item).map((value: any, cellIdx: number) => (
                        <TableCell key={cellIdx} className="whitespace-nowrap">
                          {String(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

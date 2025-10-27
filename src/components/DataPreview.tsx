import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ParsedFile } from "@/lib/fileParser";

type DataPreviewProps = {
  parsed: ParsedFile;
  maxRows?: number;
};

export function DataPreview({ parsed, maxRows = 10 }: DataPreviewProps) {
  const previewRows = parsed.rows.slice(0, maxRows);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview dos Dados</CardTitle>
        <CardDescription>
          Mostrando {previewRows.length} de {parsed.rows.length} linha(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {parsed.headers.map((header, idx) => (
                  <TableHead key={idx} className="whitespace-nowrap">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <TableCell key={cellIdx} className="whitespace-nowrap">
                      {cell || <span className="text-muted-foreground italic">vazio</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

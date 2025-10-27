import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useProdutos } from "@/hooks/useProdutos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatSimpleDate } from "@/lib/format";

export default function Produtos() {
  const { data: produtos, isLoading, isError } = useProdutos();

  if (isLoading) {
    return (
      <>
        <Header />
        <LoadingState />
      </>
    );
  }

  if (isError || !produtos) {
    return (
      <>
        <Header />
        <ErrorState message="Não foi possível carregar os produtos." />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gestão de catálogo de produtos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Preço Promocional</TableHead>
                  <TableHead>Validade da Promoção</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id_produto}>
                    <TableCell className="font-medium">{produto.nome_produto}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {produto.descricao}
                    </TableCell>
                    <TableCell>
                      <Badge variant={produto.quantidade > 0 ? "default" : "destructive"}>
                        {produto.quantidade}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(produto.preco_normal)}</TableCell>
                    <TableCell className="font-semibold">
                      {produto.preco_promo ? formatCurrency(produto.preco_promo) : "-"}
                    </TableCell>
                    <TableCell>
                      {produto.validade_promo ? formatSimpleDate(produto.validade_promo) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
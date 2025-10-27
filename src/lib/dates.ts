import { DateRange } from "@/types";

export function getDateRangeFilter(range: DateRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case "hoje":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "custom":
      // Custom will be handled by date picker
      break;
  }

  return { start, end };
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Data inválida";
  }
}

export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch {
    return "Data inválida";
  }
}

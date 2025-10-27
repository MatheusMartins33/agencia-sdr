import { useState } from "react";
import { DateRange } from "@/types";
import { UserMenu } from "./UserMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "lucide-react";

interface HeaderProps {
  onDateRangeChange?: (range: DateRange) => void;
}

export function Header({ onDateRangeChange }: HeaderProps) {
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  const handleChange = (value: DateRange) => {
    setDateRange(value);
    onDateRangeChange?.(value);
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
      </div>

      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Select value={dateRange} onValueChange={handleChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        <UserMenu />
      </div>
    </header>
  );
}

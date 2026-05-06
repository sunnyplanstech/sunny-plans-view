// Sort selector for the layer-first preview's listings rail. Thin
// wrapper over shadcn Select — the sort logic lives in
// `sortListings.ts`; this component only owns the dropdown UI.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, type SortKey } from "./sortListings";

interface SortSelectorProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className="h-8 w-[170px] text-xs">
        <span className="tp-eyebrow mr-1">Sort</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.key} value={option.key} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SortSelector;

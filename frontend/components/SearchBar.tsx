import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">
        Pronađi najjeftiniji protein
      </h2>
      <p className="text-slate-500 mb-6">
        Poredimo cene sa Pansport, Proteini.si i još mnogo prodavnica
      </p>
      <Input
        placeholder="Pretraži protein ili brend..."
        className="max-w-xl mx-auto text-base h-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
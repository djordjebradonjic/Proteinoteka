import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const[localValue,setLocalValue] = useState(value);

  useEffect(()=>{
    setLocalValue(value);
  },[value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 500);
    return () => clearTimeout(handler); 
  }, [localValue, onChange, value]);

  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">
        Pronađi najjeftiniji protein
      </h2>
      <p className="text-slate-500 mb-6">
        Poredimo cene sa Pansport, Proteini.si i još mnogo prodavnica
      </p>
      <Input
        type="text"
        placeholder="Pretraži protein ili brend..."
        className="max-w-xl mx-auto text-base h-12"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onChange(localValue);
          }
        }}
      />
    </div>
  );
}
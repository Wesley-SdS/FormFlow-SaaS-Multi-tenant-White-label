'use client';

import { useState } from 'react';
import type { FormFieldProps } from '@/domain/form/FormField.vo';

interface Props {
  field: FormFieldProps;
  onChange: (updates: Partial<FormFieldProps>) => void;
}

export default function OptionsFieldEditor({ field, onChange }: Props) {
  const [newOption, setNewOption] = useState('');
  const options = field.options ?? [];

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed || options.includes(trimmed)) return;
    onChange({ options: [...options, trimmed] });
    setNewOption('');
  };

  const removeOption = (idx: number) => {
    onChange({ options: options.filter((_, i) => i !== idx) });
  };

  const updateOption = (idx: number, value: string) => {
    const updated = [...options];
    updated[idx] = value;
    onChange({ options: updated });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Label *</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Ex: Qual é a sua preferência?"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-600">
          Opções <span className="text-zinc-400">(mínimo 2)</span>
        </label>
        <div className="space-y-1.5">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="p-1 text-zinc-400 transition-colors hover:text-red-500"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
            placeholder="Nova opção..."
            className="flex-1 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={addOption}
            disabled={!newOption.trim()}
            className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="accent-primary"
        />
        <span className="text-zinc-700">Campo obrigatório</span>
      </label>
    </div>
  );
}

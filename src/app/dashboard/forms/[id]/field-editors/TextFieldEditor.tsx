'use client';

import type { FormFieldProps } from '@/domain/form/FormField.vo';

interface Props {
  field: FormFieldProps;
  onChange: (updates: Partial<FormFieldProps>) => void;
}

export default function TextFieldEditor({ field, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Label *</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Ex: Nome completo"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Placeholder</label>
        <input
          type="text"
          value={field.placeholder ?? ''}
          onChange={(e) => onChange({ placeholder: e.target.value || undefined })}
          placeholder="Texto de ajuda no campo"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
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

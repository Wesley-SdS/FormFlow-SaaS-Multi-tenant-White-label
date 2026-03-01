'use client';

import type { FormFieldProps } from '@/domain/form/FormField.vo';

interface FormPreviewProps {
  title: string;
  description: string;
  fields: FormFieldProps[];
  onClose: () => void;
}

export default function FormPreview({ title, description, fields, onClose }: FormPreviewProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header do preview */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Preview
            </span>
            <span className="text-sm text-zinc-500">Visualização como o usuário final verá</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo do preview */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
          <div className="mx-auto w-full max-w-lg">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-zinc-900">{title || 'Título do formulário'}</h1>
              {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg space-y-4">
              {fields.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-400">
                  Adicione campos para visualizar o formulário
                </p>
              ) : (
                fields.map((field) => <PreviewField key={field.id} field={field} />)
              )}

              {fields.length > 0 && (
                <button
                  type="button"
                  className="w-full cursor-not-allowed rounded-xl bg-primary py-3 text-sm font-semibold text-white opacity-70"
                >
                  Enviar (preview)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: FormFieldProps }) {
  const baseClass =
    'block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {field.label || <span className="italic text-zinc-400">Sem label</span>}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {field.type === 'textarea' && (
        <textarea
          disabled
          rows={3}
          placeholder={field.placeholder}
          className={`${baseClass} resize-none cursor-not-allowed`}
        />
      )}

      {field.type === 'select' && (
        <select disabled className={`${baseClass} cursor-not-allowed`}>
          <option>Selecione...</option>
          {field.options?.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-1.5">
          {field.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="radio" disabled className="accent-primary" />
              {opt}
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && field.options && field.options.length > 1 && (
        <div className="space-y-1.5">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" disabled className="accent-primary" />
              {opt}
            </label>
          ))}
        </div>
      )}

      {!['textarea', 'select', 'radio', 'checkbox'].includes(field.type) && (
        <input
          type={field.type}
          disabled
          placeholder={field.placeholder}
          className={`${baseClass} cursor-not-allowed`}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { FormProps } from '@/domain/form/Form.entity';
import type { FormVersionProps } from '@/domain/form/FormVersion.entity';
import type { FormFieldProps } from '@/domain/form/FormField.vo';

interface PublicFormRendererProps {
  form: FormProps;
  version: FormVersionProps;
}

export default function PublicFormRenderer({ form, version }: PublicFormRendererProps) {
  const [values, setValues] = useState<Record<string, string | string[] | boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (fieldId: string, value: string | string[] | boolean) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // _hp é o campo honeypot (deve estar vazio)
      const res = await fetch(`/f/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values, _hp: '' }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? 'Erro ao enviar formulário');
        return;
      }

      if (body.redirectUrl) {
        window.location.href = body.redirectUrl;
        return;
      }

      setSuccessMessage(body.message ?? 'Obrigado! Sua resposta foi enviada.');
      setSubmitted(true);
    } catch {
      setError('Falha na conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">Resposta enviada!</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {successMessage ?? 'Obrigado por preencher o formulário.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-12 px-4">
      <div className="mx-auto w-full max-w-xl">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">{form.title}</h1>
          {form.description && <p className="mt-2 text-sm text-zinc-500">{form.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-8 shadow-lg space-y-6">
          {(version.schema as FormFieldProps[]).map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(v) => handleChange(field.id, v)}
            />
          ))}

          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface FieldRendererProps {
  field: FormFieldProps;
  value: string | string[] | boolean | undefined;
  onChange: (v: string | string[] | boolean) => void;
}

function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const baseClass =
    'block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {field.type === 'textarea' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={4}
          className={baseClass}
        />
      )}

      {field.type === 'select' && (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={baseClass}
        >
          <option value="">Selecione...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700"
            >
              <input
                type="radio"
                name={field.id}
                value={opt}
                checked={(value as string) === opt}
                onChange={() => onChange(opt)}
                required={field.required}
                className="accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && field.options && field.options.length > 1 && (
        <div className="space-y-2">
          {field.options.map((opt) => {
            const checked = Array.isArray(value) ? value.includes(opt) : false;
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700"
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={checked}
                  onChange={(e) => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) {
                      onChange([...arr, opt]);
                    } else {
                      onChange(arr.filter((v) => v !== opt));
                    }
                  }}
                  className="accent-primary"
                />
                {opt}
              </label>
            );
          })}
        </div>
      )}

      {field.type === 'checkbox' && (!field.options || field.options.length <= 1) && (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-primary"
          />
          {field.placeholder ?? field.label}
        </label>
      )}

      {!['textarea', 'select', 'radio', 'checkbox'].includes(field.type) && (
        <input
          type={field.type}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className={baseClass}
        />
      )}
    </div>
  );
}

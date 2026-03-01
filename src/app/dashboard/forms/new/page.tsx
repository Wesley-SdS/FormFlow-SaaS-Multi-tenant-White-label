'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewFormPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Erro ao criar formulário');
        return;
      }

      router.push(`/dashboard/forms/${body.form.id}`);
    } catch {
      setError('Falha na conexão. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Novo formulário</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Dê um nome e descrição ao seu formulário. Você poderá adicionar campos na próxima etapa.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Formulário de contato"
            maxLength={120}
            required
            autoFocus
            className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Descrição <span className="text-zinc-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o propósito do formulário..."
            maxLength={500}
            rows={3}
            className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
          />
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {creating ? 'Criando...' : 'Criar e abrir editor →'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

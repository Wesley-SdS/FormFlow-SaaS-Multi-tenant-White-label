'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useRouter } from 'next/navigation';
import type { FormProps } from '@/domain/form/Form.entity';
import type { FormFieldProps, FieldType } from '@/domain/form/FormField.vo';
import SortableFieldItem from './SortableFieldItem';
import FieldEditorFactory from './field-editors/FieldEditorFactory';
import FormPreview from './FormPreview';

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: 'text', label: 'Texto curto', icon: '𝑇' },
  { type: 'email', label: 'E-mail', icon: '@' },
  { type: 'tel', label: 'Telefone', icon: '☎' },
  { type: 'number', label: 'Número', icon: '#' },
  { type: 'textarea', label: 'Texto longo', icon: '≡' },
  { type: 'select', label: 'Lista suspensa', icon: '▾' },
  { type: 'radio', label: 'Múltipla escolha', icon: '◉' },
  { type: 'checkbox', label: 'Caixas de seleção', icon: '☑' },
  { type: 'date', label: 'Data', icon: '📅' },
  { type: 'file', label: 'Upload de arquivo', icon: '📎' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface FormBuilderProps {
  form: FormProps;
}

export default function FormBuilder({ form: initialForm }: FormBuilderProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description ?? '');
  const [fields, setFields] = useState<FormFieldProps[]>(
    Array.isArray(initialForm.schema) ? (initialForm.schema as FormFieldProps[]) : []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [publishing, setPublishing] = useState(false);
  const [isPublished] = useState(initialForm.status === 'published');
  const [showPreview, setShowPreview] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const save = useCallback(
    async (newTitle: string, newDesc: string, newFields: FormFieldProps[]) => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/forms/${initialForm.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            description: newDesc || null,
            schema: newFields,
          }),
        });
        setSaveStatus(res.ok ? 'saved' : 'error');
      } catch {
        setSaveStatus('error');
      }
    },
    [initialForm.id]
  );

  const scheduleSave = useCallback(
    (newTitle: string, newDesc: string, newFields: FormFieldProps[]) => {
      if (isPublished) return;
      isDirtyRef.current = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');
      saveTimerRef.current = setTimeout(() => {
        save(newTitle, newDesc, newFields);
      }, 3000);
    },
    [save, isPublished]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    scheduleSave(v, description, fields);
  };

  const handleDescChange = (v: string) => {
    setDescription(v);
    scheduleSave(title, v, fields);
  };

  const addField = (type: FieldType) => {
    const newField: FormFieldProps = {
      id: generateId(),
      type,
      label: `Novo campo ${type}`,
      required: false,
      order: fields.length,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Opção 1', 'Opção 2'] : undefined,
    };
    const updated = [...fields, newField];
    setFields(updated);
    setSelectedId(newField.id);
    scheduleSave(title, description, updated);
  };

  const updateField = (id: string, updates: Partial<FormFieldProps>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setFields(updated);
    scheduleSave(title, description, updated);
  };

  const removeField = (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    const reordered = updated.map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
    if (selectedId === id) setSelectedId(null);
    scheduleSave(title, description, reordered);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIdx, newIdx).map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
    scheduleSave(title, description, reordered);
  };

  const handlePublish = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      await save(title, description, fields);
    }

    setPublishing(true);
    try {
      const res = await fetch(`/api/forms/${initialForm.id}/publish`, { method: 'POST' });
      const body = await res.json();
      if (res.ok) {
        router.push('/dashboard/forms');
        router.refresh();
      } else {
        alert(body.error ?? 'Não foi possível publicar');
      }
    } finally {
      setPublishing(false);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  if (showPreview) {
    return (
      <FormPreview
        title={title}
        description={description}
        fields={fields}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Barra superior */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título do formulário"
            disabled={isPublished}
            className="min-w-0 flex-1 rounded-lg border-0 bg-transparent text-base font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <SaveIndicator status={saveStatus} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            Preview
          </button>

          {!isPublished && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || fields.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? 'Publicando...' : 'Publicar'}
            </button>
          )}

          {isPublished && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Publicado ✓
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Painel esquerdo — tipos de campo */}
        <div className="w-52 flex-shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Campos
          </p>
          <div className="grid gap-1">
            {FIELD_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                disabled={isPublished}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 transition-colors hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-sm">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Centro — canvas dos campos */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <textarea
                value={description}
                onChange={(e) => handleDescChange(e.target.value)}
                placeholder="Descrição do formulário (opcional)"
                disabled={isPublished}
                rows={2}
                className="w-full resize-none border-0 bg-transparent text-sm text-zinc-600 placeholder:text-zinc-400 focus:outline-none disabled:opacity-70"
              />
            </div>

            {fields.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-12 text-center">
                <p className="text-sm font-medium text-zinc-600">
                  {isPublished
                    ? 'Formulário publicado'
                    : 'Arraste ou clique num campo para adicionar'}
                </p>
                <p className="mt-1 text-xs text-zinc-400">Selecione um tipo no painel esquerdo</p>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <SortableFieldItem
                    key={field.id}
                    field={field}
                    isSelected={selectedId === field.id}
                    isPublished={isPublished}
                    onSelect={() => setSelectedId(field.id === selectedId ? null : field.id)}
                    onRemove={() => removeField(field.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Painel direito — propriedades do campo selecionado */}
        <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-zinc-200 bg-zinc-50">
          {selectedField ? (
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-800">Propriedades</p>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-3 rounded-lg bg-white p-2 text-center">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {FIELD_TYPES.find((t) => t.type === selectedField.type)?.label ??
                    selectedField.type}
                </span>
              </div>

              <FieldEditorFactory
                field={selectedField}
                onChange={(updates) => updateField(selectedField.id, updates)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 p-4 text-center">
              <p className="text-sm text-zinc-500">
                Selecione um campo para editar suas propriedades
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  const config = {
    saving: { text: 'Salvando...', color: 'text-zinc-400' },
    saved: { text: 'Salvo ✓', color: 'text-green-600' },
    error: { text: 'Erro ao salvar', color: 'text-red-500' },
  } as const;

  const { text, color } = config[status];
  return <span className={`text-xs ${color}`}>{text}</span>;
}

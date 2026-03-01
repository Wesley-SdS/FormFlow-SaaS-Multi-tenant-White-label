'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FormFieldProps } from '@/domain/form/FormField.vo';

const TYPE_ICONS: Record<string, string> = {
  text: 'T',
  email: '@',
  tel: '☎',
  number: '#',
  textarea: '≡',
  select: '▾',
  radio: '◉',
  checkbox: '☑',
  date: '📅',
  file: '📎',
};

interface Props {
  field: FormFieldProps;
  isSelected: boolean;
  isPublished: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function SortableFieldItem({
  field,
  isSelected,
  isPublished,
  onSelect,
  onRemove,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    disabled: isPublished,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all ${
        isSelected
          ? 'border-primary/40 bg-primary/5 shadow-sm'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
      }`}
    >
      {/* Drag handle */}
      {!isPublished && (
        <button
          type="button"
          className="flex-shrink-0 cursor-grab touch-none text-zinc-300 transition-colors hover:text-zinc-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </button>
      )}

      {/* Ícone do tipo */}
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-600">
        {TYPE_ICONS[field.type] ?? '?'}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">
          {field.label || <span className="text-zinc-400 italic">Sem label</span>}
        </p>
        <p className="text-xs text-zinc-400">
          {field.type}
          {field.required ? ' · obrigatório' : ''}
        </p>
      </div>

      {/* Botão remover */}
      {!isPublished && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 rounded-lg p-1 text-zinc-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

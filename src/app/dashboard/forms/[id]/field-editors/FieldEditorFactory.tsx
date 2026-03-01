'use client';

import type { FormFieldProps, FieldType } from '@/domain/form/FormField.vo';
import TextFieldEditor from './TextFieldEditor';
import TextareaFieldEditor from './TextareaFieldEditor';
import OptionsFieldEditor from './OptionsFieldEditor';

interface Props {
  field: FormFieldProps;
  onChange: (updates: Partial<FormFieldProps>) => void;
}

const OPTIONS_TYPES: FieldType[] = ['select', 'radio', 'checkbox'];

export default function FieldEditorFactory({ field, onChange }: Props) {
  if (OPTIONS_TYPES.includes(field.type)) {
    return <OptionsFieldEditor field={field} onChange={onChange} />;
  }

  if (field.type === 'textarea') {
    return <TextareaFieldEditor field={field} onChange={onChange} />;
  }

  return <TextFieldEditor field={field} onChange={onChange} />;
}

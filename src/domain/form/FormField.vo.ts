import { Result } from '../shared/Result';
import {
  DomainError,
  FieldLabelRequiredError,
  FieldOptionsRequiredError,
} from '../shared/DomainError';

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'file';

export const FIELD_TYPES_WITH_OPTIONS: FieldType[] = ['select', 'radio', 'checkbox'];

export interface ValidationRule {
  type: 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max';
  value: string | number;
  message: string;
}

export interface FormFieldProps {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validationRules?: ValidationRule[];
  order: number;
}

export class FormField {
  private constructor(private readonly props: FormFieldProps) {}

  static create(props: FormFieldProps): Result<FormField, DomainError> {
    if (!props.label.trim()) {
      return Result.fail(new FieldLabelRequiredError());
    }

    const needsOptions = FIELD_TYPES_WITH_OPTIONS.includes(props.type);
    if (needsOptions && (props.options?.length ?? 0) < 2) {
      return Result.fail(new FieldOptionsRequiredError(props.type));
    }

    return Result.ok(new FormField(props));
  }

  get id(): string {
    return this.props.id;
  }

  get type(): FieldType {
    return this.props.type;
  }

  get label(): string {
    return this.props.label;
  }

  get placeholder(): string | undefined {
    return this.props.placeholder;
  }

  get required(): boolean {
    return this.props.required;
  }

  get options(): string[] | undefined {
    return this.props.options;
  }

  get validationRules(): ValidationRule[] | undefined {
    return this.props.validationRules;
  }

  get order(): number {
    return this.props.order;
  }

  toJSON(): FormFieldProps {
    return { ...this.props };
  }
}

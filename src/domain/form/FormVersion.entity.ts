import type { FormFieldProps } from './FormField.vo';

export interface FormVersionProps {
  id: string;
  formId: string;
  tenantId: string;
  versionNumber: number;
  schema: FormFieldProps[];
  publishedAt: Date;
}

export class FormVersion {
  private constructor(private readonly props: FormVersionProps) {}

  static reconstitute(props: FormVersionProps): FormVersion {
    return new FormVersion(props);
  }

  get id(): string {
    return this.props.id;
  }

  get formId(): string {
    return this.props.formId;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get schema(): FormFieldProps[] {
    return this.props.schema;
  }

  get publishedAt(): Date {
    return this.props.publishedAt;
  }

  toJSON(): FormVersionProps {
    return { ...this.props };
  }
}

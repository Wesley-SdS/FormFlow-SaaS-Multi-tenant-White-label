import type { FormFieldProps } from './FormField.vo';

export type FormStatus = 'draft' | 'published' | 'archived';

export interface FormProps {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  description?: string | null;
  schema: FormFieldProps[];
  status: FormStatus;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Form {
  private constructor(private readonly props: FormProps) {}

  static reconstitute(props: FormProps): Form {
    return new Form(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get fields(): FormFieldProps[] {
    return this.props.schema;
  }

  get schema(): FormFieldProps[] {
    return this.props.schema;
  }

  get status(): FormStatus {
    return this.props.status;
  }

  get publishedAt(): Date | null | undefined {
    return this.props.publishedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isDraft(): boolean {
    return this.props.status === 'draft';
  }

  isPublished(): boolean {
    return this.props.status === 'published';
  }

  isArchived(): boolean {
    return this.props.status === 'archived';
  }

  toJSON(): FormProps {
    return { ...this.props };
  }
}

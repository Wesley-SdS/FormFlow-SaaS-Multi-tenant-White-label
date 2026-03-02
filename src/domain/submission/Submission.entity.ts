export interface SubmissionProps {
  id: string;
  tenantId: string;
  formId: string;
  formVersionId: string;
  data: Record<string, unknown>;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export class Submission {
  private constructor(private readonly props: SubmissionProps) {}

  static reconstitute(props: SubmissionProps): Submission {
    return new Submission(props);
  }

  get id(): string {
    return this.props.id;
  }
  get tenantId(): string {
    return this.props.tenantId;
  }
  get formId(): string {
    return this.props.formId;
  }
  get formVersionId(): string {
    return this.props.formVersionId;
  }
  get data(): Record<string, unknown> {
    return this.props.data;
  }
  get ipHash(): string | null {
    return this.props.ipHash;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): SubmissionProps {
    return { ...this.props };
  }
}

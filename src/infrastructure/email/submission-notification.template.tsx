import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Button,
} from '@react-email/components';

interface SubmissionNotificationProps {
  tenantName: string;
  formTitle: string;
  submissionData: Record<string, unknown>;
  primaryColor: string;
  submissionId: string;
  appUrl: string;
  formId: string;
}

export function SubmissionNotificationEmail({
  tenantName,
  formTitle,
  submissionData,
  primaryColor,
  submissionId,
  appUrl,
  formId,
}: SubmissionNotificationProps) {
  const entries = Object.entries(submissionData).slice(0, 10);

  return (
    <Html lang="pt-BR">
      <Head />
      <Body
        style={{
          backgroundColor: '#f4f4f5',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={{ maxWidth: '560px', margin: '32px auto', padding: '0 16px' }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: primaryColor,
              borderRadius: '12px 12px 0 0',
              padding: '24px 32px',
            }}
          >
            <Heading
              style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '700',
                margin: 0,
              }}
            >
              Nova resposta recebida
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', margin: '6px 0 0' }}>
              {tenantName} · {formTitle}
            </Text>
          </Section>

          {/* Body */}
          <Section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0 0 12px 12px',
              padding: '24px 32px',
            }}
          >
            <Text style={{ fontSize: '14px', color: '#3f3f46', marginTop: 0 }}>
              Um novo formulário foi preenchido. Confira os dados abaixo:
            </Text>

            {entries.map(([key, value]) => (
              <Section key={key} style={{ marginBottom: '12px' }}>
                <Text
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#71717a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 2px',
                  }}
                >
                  {key}
                </Text>
                <Text
                  style={{
                    fontSize: '14px',
                    color: '#18181b',
                    margin: 0,
                    padding: '8px 12px',
                    backgroundColor: '#f4f4f5',
                    borderRadius: '6px',
                    wordBreak: 'break-word',
                  }}
                >
                  {Array.isArray(value) ? value.join(', ') : String(value ?? '—')}
                </Text>
              </Section>
            ))}

            {Object.keys(submissionData).length > 10 && (
              <Text style={{ fontSize: '12px', color: '#71717a', marginTop: '8px' }}>
                + {Object.keys(submissionData).length - 10} campos adicionais
              </Text>
            )}

            <Hr style={{ borderColor: '#e4e4e7', margin: '24px 0' }} />

            <Button
              href={`${appUrl}/dashboard/forms/${formId}/submissions`}
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Ver todas as respostas →
            </Button>

            <Text
              style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '24px', marginBottom: 0 }}
            >
              ID da submissão: {submissionId}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

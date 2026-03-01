import type { Metadata } from 'next';
import { ThemeEditor } from './ThemeEditor';

export const metadata: Metadata = {
  title: 'Tema — FormFlow',
  description: 'Personalize cores, fonte e logo',
};

export default function ThemeSettingsPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Configurar tema</h1>
      <p className="text-sm text-zinc-500">Cores, fonte e logo aplicados ao seu subdomínio.</p>
      <ThemeEditor />
    </div>
  );
}

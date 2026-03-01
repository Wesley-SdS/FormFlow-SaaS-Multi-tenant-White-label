import { describe, it, expect } from 'vitest';
import { SlugVO } from './Slug.vo';

describe('SlugVO', () => {
  it('aceita slug válido lowercase com hífens', () => {
    const result = SlugVO.create('minha-empresa');
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.value).toBe('minha-empresa');
  });

  it('aceita slug de um único caractere alfanumérico', () => {
    const result = SlugVO.create('a');
    expect(result.isSuccess).toBe(false); // min 2 chars
  });

  it('aceita slug com 2 caracteres', () => {
    const result = SlugVO.create('ab');
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.value).toBe('ab');
  });

  it('rejeita slug com espaços', () => {
    const result = SlugVO.create('minha empresa');
    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('SLUG_INVALID');
  });

  it('rejeita slug com maiúsculas', () => {
    const result = SlugVO.create('MinhaEmpresa');
    expect(result.isFailure).toBe(true);
  });

  it('rejeita slug com caracteres especiais', () => {
    expect(SlugVO.create('minha_empresa').isFailure).toBe(true);
    expect(SlugVO.create('minha.empresa').isFailure).toBe(true);
    expect(SlugVO.create('minha@empresa').isFailure).toBe(true);
  });

  it('rejeita slug que começa com hífen', () => {
    const result = SlugVO.create('-minha-empresa');
    expect(result.isFailure).toBe(true);
  });

  it('rejeita slug que termina com hífen', () => {
    const result = SlugVO.create('minha-empresa-');
    expect(result.isFailure).toBe(true);
  });

  it('rejeita slug com menos de 2 caracteres', () => {
    const result = SlugVO.create('a');
    expect(result.isFailure).toBe(true);
  });

  it('rejeita slug com mais de 63 caracteres', () => {
    const long = 'a'.repeat(64);
    const result = SlugVO.create(long);
    expect(result.isFailure).toBe(true);
  });
});

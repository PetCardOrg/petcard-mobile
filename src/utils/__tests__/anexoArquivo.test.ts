import { formatarTamanho, mimeDoArquivo } from '../anexoArquivo';

describe('mimeDoArquivo', () => {
  it('prefere o tipo declarado quando é um dos aceitos', () => {
    expect(mimeDoArquivo('x.bin', 'image/webp')).toBe('image/webp');
  });

  it('cai na extensão, sem diferenciar maiúsculas, quando o tipo não vem', () => {
    expect(mimeDoArquivo('Vacina.JPG')).toBe('image/jpeg');
    expect(mimeDoArquivo('recibo.pdf', null)).toBe('application/pdf');
  });

  it('devolve null para o que a API recusaria (ex.: HEIC), em vez de adivinhar', () => {
    expect(mimeDoArquivo('foto.heic', 'image/heic')).toBeNull();
    expect(mimeDoArquivo('semextensao')).toBeNull();
  });
});

describe('formatarTamanho', () => {
  it('usa KB abaixo de 1 MB e MB com vírgula acima', () => {
    expect(formatarTamanho(200)).toBe('1 KB');
    expect(formatarTamanho(2048)).toBe('2 KB');
    expect(formatarTamanho(1.5 * 1024 * 1024)).toBe('1,5 MB');
  });
});

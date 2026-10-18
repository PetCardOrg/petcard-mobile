import { parseConnectOutcome } from '../calendar.service';

// A volta do OAuth decide o que o tutor vê: confirmação, aviso de cancelado
// ou erro. Ler errado é dizer "conectado" para quem não conectou.
describe('parseConnectOutcome', () => {
  it('lê o resultado do app instalado e do Expo Go', () => {
    expect(parseConnectOutcome('petcard:///?calendar=connected')).toBe('connected');
    expect(parseConnectOutcome('exp://192.168.0.10:8081/--/?calendar=denied')).toBe('denied');
    expect(parseConnectOutcome('petcard:///?foo=1&calendar=error')).toBe('error');
  });

  it('ignora volta sem resultado ou com valor desconhecido', () => {
    expect(parseConnectOutcome('petcard:///')).toBeNull();
    expect(parseConnectOutcome('petcard:///?calendar=talvez')).toBeNull();
  });
});

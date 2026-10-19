import { avatarPickerOptions } from '../avatarPicker';

describe('avatarPickerOptions', () => {
  it('não usa o editor no iOS, para abrir o PHPicker em vez do seletor antigo e lento', () => {
    expect(avatarPickerOptions('ios').allowsEditing).toBe(false);
  });

  it('mantém o recorte quadrado no Android', () => {
    const options = avatarPickerOptions('android');
    expect(options.allowsEditing).toBe(true);
    expect(options.aspect).toEqual([1, 1]);
  });
});

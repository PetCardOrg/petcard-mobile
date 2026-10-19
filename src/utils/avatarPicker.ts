import { Platform } from 'react-native';
import type { ImagePickerOptions } from 'expo-image-picker';

/**
 * Opções do seletor de foto de avatar (perfil, tutor, pet).
 *
 * No iOS, `allowsEditing: true` faz o expo-image-picker abrir o
 * `UIImagePickerController` antigo, que demora para listar a galeria. Sem
 * edição ele usa o `PHPicker`, que abre na hora. O recorte quadrado fica por
 * conta do avatar (`resizeMode: cover`); no Android o editor segue ligado.
 */
export function avatarPickerOptions(platform: string = Platform.OS): ImagePickerOptions {
  return {
    mediaTypes: ['images'],
    allowsEditing: platform !== 'ios',
    aspect: [1, 1],
    quality: 0.8,
  };
}

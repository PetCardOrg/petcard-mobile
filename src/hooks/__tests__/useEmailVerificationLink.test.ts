import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useEmailVerificationLink } from '../useEmailVerificationLink';

const mockVerifyEmail = jest.fn();
const mockUpdateUser = jest.fn().mockResolvedValue(undefined);
let mockUser: { email_verified?: boolean } | null;

jest.mock('../../services', () => ({
  authService: { verifyEmail: (t: string) => mockVerifyEmail(t) },
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser }),
}));

describe('useEmailVerificationLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { email_verified: false };
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'parse').mockReturnValue({
      path: 'verify-email',
      queryParams: { token: 'tok-xyz' },
      hostname: null,
      scheme: null,
    } as unknown as ReturnType<typeof Linking.parse>);
  });

  it('confirma o e-mail e atualiza a sessão quando chega um deep link de verificação', async () => {
    mockVerifyEmail.mockResolvedValue(undefined);
    jest.spyOn(Linking, 'useURL').mockReturnValue('exp://x/--/verify-email?token=tok-xyz');

    renderHook(() => useEmailVerificationLink());

    await waitFor(() => expect(mockVerifyEmail).toHaveBeenCalledWith('tok-xyz'));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ email_verified: true }));
  });

  it('não faz nada se não há sessão (a AuthStack cuida disso)', () => {
    mockUser = null;
    jest.spyOn(Linking, 'useURL').mockReturnValue('exp://x/--/verify-email?token=tok-xyz');

    renderHook(() => useEmailVerificationLink());

    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it('ignora deep links que não são de verificação', () => {
    jest.spyOn(Linking, 'parse').mockReturnValue({
      path: 'reset-password',
      queryParams: { token: 'tok-xyz' },
    } as unknown as ReturnType<typeof Linking.parse>);
    jest.spyOn(Linking, 'useURL').mockReturnValue('exp://x/--/reset-password?token=tok-xyz');

    renderHook(() => useEmailVerificationLink());

    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });
});

'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { signTransactionWithFreighter } from '~/lib/freighter-utils';
import { getNetworkName, getNetworkPassphrase, logNetworkInfo } from '~/lib/network-utils';
import { apiUtils } from '../../services/api';
// FIXED: Import functions and types separately
import { login as apiEmailLogin, logout as apiLogout } from '../../services/authService';
import type { AuthResponse } from '../../services/authService';
import { useWallet } from '../useWallet';

// --- Type Definitions ---

interface User {
  id: string;
  email?: string;
  name: string;
  publicKey?: string;
  authType?: 'email' | 'wallet';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  authType: 'email' | 'wallet' | null;
}

interface ChallengeResponse {
  challenge: string;
}

interface WalletAuthResponse {
  user: {
    id: string;
    name?: string;
  };
  token: string;
}

// --- API Service Object ---
const authAPI = {
  logout: () => apiUtils.request('/auth/logout', { method: 'POST' }),
  requestChallenge: (publicKey: string): Promise<ChallengeResponse> =>
    apiUtils.request('/auth/wallet/challenge', {
      method: 'POST',
      body: JSON.stringify({ publicKey }),
    }),
  authenticateWallet: (
    publicKey: string,
    signedXdr: string,
    challenge: string
  ): Promise<WalletAuthResponse> =>
    apiUtils.request('/auth/wallet/authenticate', {
      method: 'POST',
      body: JSON.stringify({ publicKey, signedXdr, challenge }),
    }),
};

// --- Auth Context ---

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: async () => {},
  loginWithWallet: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  authType: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authType, setAuthType] = useState<'email' | 'wallet' | null>(null);
  const { network, networkPassphrase, getPublicKey } = useWallet();

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      const storedUser = localStorage.getItem('user');
      const storedAuthType = localStorage.getItem('authType') as 'email' | 'wallet' | null;

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAuthType(storedAuthType);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          apiUtils.clearAuth();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response: AuthResponse = await apiEmailLogin(email, password);
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        authType: 'email',
      };

      setUser(userData);
      setAuthType('email');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authType', 'email');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWallet = async () => {
    setIsLoading(true);
    try {
      const walletPublicKey = await getPublicKey();
      if (!walletPublicKey) {
        throw new Error('Failed to get public key from wallet');
      }

      console.log('🔑 Using public key:', walletPublicKey);
      logNetworkInfo(network, 'TESTNET');

      const challengeResponse = await authAPI.requestChallenge(walletPublicKey);
      const { challenge } = challengeResponse;

      const { TransactionBuilder, Account, Memo, BASE_FEE } = await import('@stellar/stellar-sdk');

      if (challenge.length > 28) {
        throw new Error('Challenge too long for transaction memo');
      }

      const walletNetworkPassphrase = networkPassphrase || getNetworkPassphrase(network);
      const targetNetworkName = getNetworkName(network);

      console.log('🌐 Transaction Network Info:', {
        walletNetwork: network,
        usingPassphrase: walletNetworkPassphrase,
        targetNetworkName,
      });

      const account = new Account(walletPublicKey, '0');
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: walletNetworkPassphrase,
      })
        .addMemo(Memo.text(challenge))
        .setTimeout(30)
        .build();

      const signResult = await signTransactionWithFreighter(transaction.toXDR(), {
        network: targetNetworkName.toUpperCase(),
        networkPassphrase: walletNetworkPassphrase,
        address: walletPublicKey,
      });

      if (signResult.error || !signResult.signedTxXdr) {
        throw new Error(signResult.error || 'Failed to sign transaction.');
      }

      console.log('✅ Transaction signed successfully');

      const authResponse = await authAPI.authenticateWallet(
        walletPublicKey,
        signResult.signedTxXdr,
        challenge
      );

      const userData: User = {
        id: authResponse.user.id,
        name: authResponse.user.name || 'Wallet User',
        publicKey: walletPublicKey,
        authType: 'wallet',
      };

      setUser(userData);
      setAuthType('wallet');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authType', 'wallet');
      localStorage.setItem('authToken', authResponse.token);

      console.log('🎉 Wallet authentication successful!');
    } catch (error) {
      console.error('Wallet login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('API logout failed, clearing local session anyway.', error);
    } finally {
      setUser(null);
      setAuthType(null);
      apiLogout();
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithWallet,
        logout,
        isAuthenticated,
        authType,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

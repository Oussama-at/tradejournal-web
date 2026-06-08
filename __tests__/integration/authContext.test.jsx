/**
 * Integration tests — AuthContext
 *
 * Tests login / logout state management and localStorage interaction.
 *
 * Run:  npm test -- --testPathPattern="authContext"
 *
 * Dependencies (already bundled with react-scripts):
 *   @testing-library/react
 *   @testing-library/react-hooks  (via react-scripts)
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────
/** Build a minimal valid JWT (not cryptographically signed) */
function makeJWT(payload = {}) {
  const defaultPayload = {
    sub:  'testuser',
    exp:  Math.floor(Date.now() / 1000) + 3600,
    iat:  Math.floor(Date.now() / 1000),
    role: 'user',
    ...payload,
  };
  const b64 = btoa(JSON.stringify(defaultPayload));
  return `eyJhbGciOiJIUzI1NiJ9.${b64}.fakesig`;
}

function makeExpiredJWT() {
  return makeJWT({ exp: Math.floor(Date.now() / 1000) - 60 });
}

/** Test component that exposes auth state via data-testid */
function AuthConsumer() {
  const { user, sub, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.username : 'null'}</span>
      <span data-testid="role">{user ? user.role    : 'null'}</span>
    </div>
  );
}

/** Wrapper that provides AuthContext */
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

// ── Mock api.js to avoid real HTTP calls ─────────────────────────────────
jest.mock('../../services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: null })),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Initial load — no token in localStorage
// ─────────────────────────────────────────────────────────────────────────────
describe('AuthContext — initial state (no token)', () => {
  beforeEach(() => localStorage.clear());

  test('loading transitions from true to false', async () => {
    render(<AuthConsumer />, { wrapper });
    // After async resolution loading should be false
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });

  test('user is null when no token stored', async () => {
    render(<AuthConsumer />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Initial load — valid token in localStorage
// ─────────────────────────────────────────────────────────────────────────────
describe('AuthContext — initial state (valid token)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token',    makeJWT());
    localStorage.setItem('username', 'alice');
    localStorage.setItem('role',     'user');
  });
  afterEach(() => localStorage.clear());

  test('user is populated from localStorage', async () => {
    render(<AuthConsumer />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'));
  });

  test('role is populated from localStorage', async () => {
    render(<AuthConsumer />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('user'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Initial load — expired token
// ─────────────────────────────────────────────────────────────────────────────
describe('AuthContext — expired token is cleared', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token',    makeExpiredJWT());
    localStorage.setItem('username', 'expireduser');
  });
  afterEach(() => localStorage.clear());

  test('user is null when token is expired', async () => {
    render(<AuthConsumer />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
  });

  test('localStorage is cleared when token is expired', async () => {
    render(<AuthConsumer />, { wrapper });
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. login() function
// ─────────────────────────────────────────────────────────────────────────────
function LoginButton() {
  const { user, login } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'null'}</span>
      <button onClick={() => login(makeJWT(), 'bob', 'admin')}>Login</button>
    </div>
  );
}

describe('AuthContext — login()', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  test('sets user after login()', async () => {
    render(<LoginButton />, { wrapper });
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));

    act(() => screen.getByRole('button').click());

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('bob'));
  });

  test('persists token and username to localStorage', async () => {
    render(<LoginButton />, { wrapper });
    act(() => screen.getByRole('button').click());

    await waitFor(() => {
      expect(localStorage.getItem('username')).toBe('bob');
      expect(localStorage.getItem('role')).toBe('admin');
      expect(localStorage.getItem('token')).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. logout() function
// ─────────────────────────────────────────────────────────────────────────────
function LogoutButton() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'null'}</span>
      <button data-testid="login-btn"  onClick={() => login(makeJWT(), 'carol', 'user')}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext — logout()', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  test('clears user after logout()', async () => {
    render(<LogoutButton />, { wrapper });

    act(() => screen.getByTestId('login-btn').click());
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('carol'));

    act(() => screen.getByTestId('logout-btn').click());
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'));
  });

  test('clears localStorage after logout()', async () => {
    render(<LogoutButton />, { wrapper });

    act(() => screen.getByTestId('login-btn').click());
    await waitFor(() => expect(localStorage.getItem('username')).toBe('carol'));

    act(() => screen.getByTestId('logout-btn').click());
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(localStorage.getItem('role')).toBeNull();
    });
  });
});

/**
 * Integration tests — Login page
 *
 * Tests:
 *  • Form rendering
 *  • Validation (empty fields)
 *  • Successful login flow
 *  • Failed login error display
 *  • Saved username chip
 *
 * Run:  npm test -- --testPathPattern="loginPage"
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock dependencies ─────────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

let mockLogin  = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('../../lang/LangContext', () => ({
  useLang: () => ({
    t: (k) => k, lang: 'en', isRTL: false,
    toggleLang: jest.fn(), setLang: jest.fn(),
  }),
}));

let mockGetSavedUsername = jest.fn(() => '');
let mockClearSavedUsername = jest.fn();
let mockSaveSavedUsername  = jest.fn();
let mockGetConsent = jest.fn(() => ({ savedLogin: false, decided: false }));

jest.mock('../../utils/cookies', () => ({
  getSavedUsername:    () => mockGetSavedUsername(),
  clearSavedUsername:  ()  => mockClearSavedUsername(),
  saveSavedUsername:   (u) => mockSaveSavedUsername(u),
  getConsent:          () => mockGetConsent(),
}));

let mockApiPost = jest.fn();
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    postNoAuth: (...args) => mockApiPost(...args),
    get: jest.fn(() => Promise.resolve({ data: null })),
  },
}));

import Login from '../../pages/Login';

const renderLogin = () =>
  render(<MemoryRouter><Login /></MemoryRouter>);

function makeJWT() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `h.${btoa(JSON.stringify({ exp, role: 'user' }))}.s`;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Login — rendering', () => {
  beforeEach(() => {
    mockGetSavedUsername.mockReturnValue('');
    localStorage.clear();
  });

  test('renders username and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  test('renders login submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
  });

  test('shows saved username chip when username is pre-filled', () => {
    mockGetSavedUsername.mockReturnValue('alice');
    renderLogin();
    expect(screen.getByText(/alice/)).toBeInTheDocument();
    expect(screen.getByText(/clear/i)).toBeInTheDocument();
  });

  test('does not show chip when no saved username', () => {
    mockGetSavedUsername.mockReturnValue('');
    renderLogin();
    expect(screen.queryByText(/clear/i)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Login — validation', () => {
  beforeEach(() => { mockGetSavedUsername.mockReturnValue(''); });

  test('shows error when username is empty', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));
    await waitFor(() => expect(screen.getByText(/username/i)).toBeInTheDocument());
  });

  test('shows error when password is empty', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'bob' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));
    await waitFor(() => expect(screen.getByText(/password/i)).toBeInTheDocument());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Login — success', () => {
  beforeEach(() => {
    mockGetSavedUsername.mockReturnValue('');
    mockGetConsent.mockReturnValue({ savedLogin: false, decided: true });
    mockApiPost.mockResolvedValue({
      success: true,
      data: { token: makeJWT(), first_login: false },
    });
  });
  afterEach(() => { mockNavigate.mockClear(); mockLogin.mockClear(); });

  test('calls auth.login() with correct args on success', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    expect(mockLogin.mock.calls[0][1]).toBe('alice'); // username arg
  });

  test('navigates to "/" after successful login', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('navigates to "/profile?setup_security=1" on first_login', async () => {
    mockApiPost.mockResolvedValue({
      success: true,
      data: { token: makeJWT(), first_login: true },
    });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/profile?setup_security=1')
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Login — failure', () => {
  beforeEach(() => {
    mockGetSavedUsername.mockReturnValue('');
    mockApiPost.mockResolvedValue({ success: false, message: 'Invalid credentials' });
  });

  test('shows error message from API on failure', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'bad' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    );
  });

  test('shows fallback error when API throws network error', async () => {
    mockApiPost.mockRejectedValue(new Error('Network error'));
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'u' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'p' } });
    fireEvent.click(screen.getByRole('button', { name: /login|sign in/i }));

    await waitFor(() =>
      expect(screen.getByText(/server|reach/i)).toBeInTheDocument()
    );
  });
});

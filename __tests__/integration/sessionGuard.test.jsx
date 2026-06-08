/**
 * Integration tests — SessionGuard component
 *
 * Tests the session-expiry warning flow:
 *   • no render when not logged in
 *   • warning dialog when token is about to expire
 *   • "Stay" resets the warning
 *   • "Logout" calls auth.logout()
 *
 * Run:  npm test -- --testPathPattern="sessionGuard"
 */

import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';

// ── Helpers ───────────────────────────────────────────────────────────────
function makeJWT(expOffsetSeconds) {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSeconds;
  const b64 = btoa(JSON.stringify({ sub: 'u1', exp }));
  return `h.${b64}.s`;
}

// ── Mock LangContext ──────────────────────────────────────────────────────
jest.mock('../../lang/LangContext', () => ({
  useLang: () => ({
    t: (key, vals) => {
      if (vals) return key + JSON.stringify(vals);
      return key;
    },
    lang: 'en', isRTL: false,
  }),
}));

// ── Mock AuthContext ──────────────────────────────────────────────────────
let mockLogout = jest.fn();
let mockUser   = null;

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}));

// ── Mock cookies msUntilExpiry ────────────────────────────────────────────
let mockMsUntilExpiry = null;

jest.mock('../../utils/cookies', () => ({
  msUntilExpiry: () => mockMsUntilExpiry,
}));

import SessionGuard from '../../components/SessionGuard';

// ─────────────────────────────────────────────────────────────────────────────
describe('SessionGuard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUser       = null;
    mockLogout     = jest.fn();
    mockMsUntilExpiry = null;
    localStorage.setItem('token', makeJWT(3600));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    localStorage.clear();
  });

  // ── Not logged in ─────────────────────────────────────────────────────
  test('renders nothing when user is null', () => {
    mockUser = null;
    const { container } = render(<SessionGuard />);
    expect(container).toBeEmptyDOMElement();
  });

  // ── Logged in, plenty of time ─────────────────────────────────────────
  test('renders nothing when token has plenty of time left', () => {
    mockUser          = { username: 'alice', token: makeJWT(3600) };
    mockMsUntilExpiry = 25 * 60 * 1000; // 25 minutes
    render(<SessionGuard />);
    act(() => jest.advanceTimersByTime(15_000)); // 15 s tick
    expect(screen.queryByText('session_warning_title')).toBeNull();
  });

  // ── Warning dialog ────────────────────────────────────────────────────
  test('shows warning dialog when < 2 min remain', async () => {
    mockUser          = { username: 'alice', token: makeJWT(90) };
    mockMsUntilExpiry = 90_000; // 90 seconds
    render(<SessionGuard />);
    // Immediate check fires on mount
    await waitFor(() =>
      expect(screen.getByText('session_warning_title')).toBeInTheDocument()
    );
  });

  test('warning dialog shows "Stay Logged In" and "Logout Now" buttons', async () => {
    mockUser          = { username: 'alice', token: makeJWT(90) };
    mockMsUntilExpiry = 90_000;
    render(<SessionGuard />);
    await waitFor(() => screen.getByText('session_warning_title'));
    expect(screen.getByText(/session_stay/)).toBeInTheDocument();
    expect(screen.getByText(/session_logout_now/)).toBeInTheDocument();
  });

  test('"Logout Now" calls logout()', async () => {
    mockUser          = { username: 'alice', token: makeJWT(90) };
    mockMsUntilExpiry = 90_000;
    render(<SessionGuard />);
    await waitFor(() => screen.getByText('session_warning_title'));

    fireEvent.click(screen.getByText(/session_logout_now/));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('"Stay Logged In" dismisses the warning', async () => {
    mockUser          = { username: 'alice', token: makeJWT(90) };
    mockMsUntilExpiry = 90_000;
    render(<SessionGuard />);
    await waitFor(() => screen.getByText('session_warning_title'));

    // After clicking Stay the dialog should disappear
    mockMsUntilExpiry = 3600_000; // pretend token refreshed
    fireEvent.click(screen.getByText(/session_stay/));
    await waitFor(() =>
      expect(screen.queryByText('session_warning_title')).toBeNull()
    );
  });

  // ── Expired dialog ────────────────────────────────────────────────────
  test('shows expired dialog when token ms = 0', async () => {
    mockUser          = { username: 'alice', token: makeJWT(-10) };
    mockMsUntilExpiry = 0;
    render(<SessionGuard />);
    await waitFor(() =>
      expect(screen.getByText('session_expired_title')).toBeInTheDocument()
    );
  });

  test('"Go to Login" button appears on expired dialog', async () => {
    mockUser          = { username: 'alice', token: makeJWT(-10) };
    mockMsUntilExpiry = 0;
    render(<SessionGuard />);
    await waitFor(() => screen.getByText('session_expired_title'));
    expect(screen.getByText(/session_login_again/)).toBeInTheDocument();
  });

  test('"Go to Login" calls logout()', async () => {
    mockUser          = { username: 'alice', token: makeJWT(-10) };
    mockMsUntilExpiry = 0;
    render(<SessionGuard />);
    await waitFor(() => screen.getByText('session_expired_title'));

    fireEvent.click(screen.getByText(/session_login_again/));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

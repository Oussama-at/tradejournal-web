/**
 * Integration tests — CookieBanner component
 *
 * Run:  npm test -- --testPathPattern="cookieBanner"
 */

import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';

// ── Mock LangContext ──────────────────────────────────────────────────────
jest.mock('../../lang/LangContext', () => ({
  useLang: () => ({
    t: (key) => key, // return the key itself as the translation
    lang: 'en',
    isRTL: false,
  }),
}));

// ── Mock cookies utils ────────────────────────────────────────────────────
let mockConsent = { necessary: true, analytics: false, preferences: false, savedLogin: false, decided: false };
let mockDecided = false;

jest.mock('../../utils/cookies', () => ({
  getConsent:   () => mockConsent,
  saveConsent:  jest.fn((c) => { mockConsent = { ...mockConsent, ...c, decided: true }; return mockConsent; }),
  hasDecided:   () => mockDecided,
  deleteCookie: jest.fn(),
}));

import CookieBanner from '../../components/CookieBanner';

// ─────────────────────────────────────────────────────────────────────────────
describe('CookieBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDecided = false;
    mockConsent = { necessary: true, analytics: false, preferences: false, savedLogin: false, decided: false };
  });
  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });

  test('does NOT render immediately (has 800ms delay)', () => {
    render(<CookieBanner />);
    // Before the delay fires, nothing is visible
    expect(screen.queryByText('cookie_title')).toBeNull();
  });

  test('renders after 800ms delay when consent not yet decided', async () => {
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    await waitFor(() => expect(screen.getByText('cookie_title')).toBeInTheDocument());
  });

  test('does NOT render when consent already decided', () => {
    mockDecided = true;
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    expect(screen.queryByText('cookie_title')).toBeNull();
  });

  test('"Accept All" button is visible', async () => {
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    await waitFor(() => expect(screen.getByText(/cookie_accept_all/)).toBeInTheDocument());
  });

  test('"Reject All" button is visible', async () => {
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    await waitFor(() => expect(screen.getByText(/cookie_reject_all/)).toBeInTheDocument());
  });

  test('"Customize" button expands the panel', async () => {
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    await waitFor(() => screen.getByText(/cookie_customize/));

    fireEvent.click(screen.getByText(/cookie_customize/));
    await waitFor(() => expect(screen.getByText('cookie_necessary')).toBeInTheDocument());
  });

  test('clicking "Accept All" calls saveConsent', async () => {
    const { saveConsent } = require('../../utils/cookies');
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    await waitFor(() => screen.getByText(/cookie_accept_all/));

    fireEvent.click(screen.getByText(/cookie_accept_all/));
    expect(saveConsent).toHaveBeenCalledWith(
      expect.objectContaining({ analytics: true, preferences: true, savedLogin: true })
    );
  });

  test('clicking "Reject All" calls saveConsent with all false', async () => {
    const { saveConsent } = require('../../utils/cookies');
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    await waitFor(() => screen.getByText(/cookie_reject_all/));

    fireEvent.click(screen.getByText(/cookie_reject_all/));
    expect(saveConsent).toHaveBeenCalledWith(
      expect.objectContaining({ analytics: false, preferences: false, savedLogin: false })
    );
  });

  test('banner hides after accepting (dismiss animation)', async () => {
    render(<CookieBanner />);
    act(() => jest.advanceTimersByTime(900));
    await waitFor(() => screen.getByText(/cookie_accept_all/));

    fireEvent.click(screen.getByText(/cookie_accept_all/));
    // After dismiss transition (400ms) the banner should be gone
    act(() => jest.advanceTimersByTime(500));
    await waitFor(() => expect(screen.queryByText('cookie_title')).toBeNull());
  });
});

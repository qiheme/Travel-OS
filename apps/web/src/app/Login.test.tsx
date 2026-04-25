import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/db', () => ({
  signInWithMagicLink: vi.fn(),
}));

import { signInWithMagicLink } from '../lib/db';
import { Login } from './Login';

const mockSignIn = signInWithMagicLink as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('Login', () => {
  it('renders email input and disabled submit button when empty', () => {
    render(<Login />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeDisabled();
  });

  it('enables submit button when email is entered', () => {
    render(<Login />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    expect(screen.getByRole('button', { name: /send magic link/i })).not.toBeDisabled();
  });

  it('shows confirmation screen with email after successful sign-in', async () => {
    mockSignIn.mockResolvedValue({ error: null });
    render(<Login />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('shows error alert when sign-in fails', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('rate limited') });
    render(<Login />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('rate limited');
  });

  it('keeps submit button enabled after an error so the user can retry', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('oops') });
    render(<Login />);
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /send magic link/i })).not.toBeDisabled();
  });
});

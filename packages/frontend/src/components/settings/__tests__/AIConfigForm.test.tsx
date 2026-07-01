import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIConfigForm from '../AIConfigForm';

describe('AIConfigForm', () => {
  const mockOnSuccess = vi.fn();
  const defaultProps = { workspaceId: 'ws-001', token: 'mock-token', onSuccess: mockOnSuccess };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders form fields and submit button', () => {
    render(<AIConfigForm {...defaultProps} />);
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Model name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Configuration' })).toBeInTheDocument();
  });

  it('disables submit when model name is empty', () => {
    render(<AIConfigForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Add Configuration' })).toBeDisabled();
  });

  it('enables submit when model name is filled', () => {
    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Model name'), {
      target: { value: 'claude-sonnet-4-6' },
    });
    expect(screen.getByRole('button', { name: 'Add Configuration' })).toBeEnabled();
  });

  it('shows validation error when API key is missing for cloud provider', async () => {
    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Model name'), {
      target: { value: 'claude-sonnet-4-6' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Configuration' }));

    await waitFor(() => {
      expect(screen.getByText('API key is required for cloud providers.')).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits and calls onSuccess on a 2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cfg-001' }),
    } as Response);

    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Model name'), {
      target: { value: 'claude-sonnet-4-6' },
    });
    fireEvent.change(screen.getByLabelText(/API key/i), { target: { value: 'sk-test-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Configuration' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/workspaces/ws-001/ai-config',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows server error detail on failed submit', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Provider not supported' }),
    } as Response);

    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Model name'), { target: { value: 'gpt-4' } });
    fireEvent.change(screen.getByLabelText(/API key/i), { target: { value: 'sk-test-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Configuration' }));

    await waitFor(() => {
      expect(screen.getByText('Provider not supported')).toBeInTheDocument();
    });
  });

  it('shows base URL field when Custom/Local provider is selected', () => {
    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'Custom/Local' } });
    expect(screen.getByLabelText('Base URL')).toBeInTheDocument();
  });

  it('auto-checks isLocal when Custom/Local is selected', () => {
    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'Custom/Local' } });
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });

  it('shows base URL field for Azure OpenAI provider', () => {
    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'Azure OpenAI' } });
    expect(screen.getByLabelText('Base URL')).toBeInTheDocument();
  });

  it('allows submit without API key when isLocal is checked', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'cfg-002' }),
    } as Response);

    render(<AIConfigForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'Custom/Local' } });
    fireEvent.change(screen.getByLabelText('Model name'), { target: { value: 'llama3' } });
    fireEvent.change(screen.getByLabelText('Base URL'), {
      target: { value: 'http://localhost:11434' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Configuration' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});

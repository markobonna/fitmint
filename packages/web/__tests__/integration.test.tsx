import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import Home from '../app/page';

// Mock MiniKit
const mockMiniKit = {
  isInstalled: jest.fn(() => true),
  commands: {
    verify: jest.fn(),
    pay: jest.fn(),
    requestNotificationPermission: jest.fn(),
    scheduleNotification: jest.fn(),
    sendNotification: jest.fn(),
  },
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

// Mock global fetch
global.fetch = jest.fn();

jest.mock('@worldcoin/minikit-js', () => ({
  MiniKit: mockMiniKit,
}));

describe('FitMint Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    mockMiniKit.commands.verify.mockResolvedValue({
      status: 'success',
      proof: { 
        merkle_root: '0x123',
        nullifier_hash: '0x456',
        proof: '0x789'
      },
      isHuman: true
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: 8500,
        exerciseMinutes: 25,
        calories: 350,
        lastSync: new Date().toISOString(),
      }),
    });
  });

  test('User can verify with World ID', async () => {
    render(<Home />);
    
    const verifyButton = screen.getByText(/Verify with World ID/i);
    expect(verifyButton).toBeInTheDocument();
    
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(mockMiniKit.commands.verify).toHaveBeenCalledWith({
        action: 'fitness-verification',
        signal: 'unique-human',
        verification_level: 'Device',
      });
    });
    
    // After verification, the verify button should be replaced with user info
    await waitFor(() => {
      expect(screen.queryByText(/Verify with World ID/i)).not.toBeInTheDocument();
    });
  });

  test('Health data displays correctly when goals not met', async () => {
    // Mock health data with goals not met
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: 7500, // Below 10k threshold
        exerciseMinutes: 20, // Below 30min threshold
        calories: 250,
        lastSync: new Date().toISOString(),
      }),
    });

    render(<Home />);
    
    // Wait for health data to load
    await waitFor(() => {
      expect(screen.getByText(/7,500/)).toBeInTheDocument();
      expect(screen.getByText(/20 minutes/)).toBeInTheDocument();
    });

    // Claim button should be disabled
    const claimButton = screen.getByRole('button', { name: /claim.*reward/i });
    expect(claimButton).toBeDisabled();
  });

  test('Claim button enables when step goal is met', async () => {
    // Mock health data with step goal met
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: 11000, // Above 10k threshold
        exerciseMinutes: 25, // Below 30min but steps are enough
        calories: 450,
        lastSync: new Date().toISOString(),
      }),
    });

    render(<Home />);
    
    // Wait for health data to load
    await waitFor(() => {
      expect(screen.getByText(/11,000/)).toBeInTheDocument();
    });

    // Claim button should be enabled
    const claimButton = screen.getByRole('button', { name: /claim.*reward/i });
    expect(claimButton).not.toBeDisabled();
  });

  test('Claim button enables when exercise goal is met', async () => {
    // Mock health data with exercise goal met
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: 8000, // Below 10k threshold
        exerciseMinutes: 35, // Above 30min threshold
        calories: 400,
        lastSync: new Date().toISOString(),
      }),
    });

    render(<Home />);
    
    // Wait for health data to load
    await waitFor(() => {
      expect(screen.getByText(/35 minutes/)).toBeInTheDocument();
    });

    // Claim button should be enabled
    const claimButton = screen.getByRole('button', { name: /claim.*reward/i });
    expect(claimButton).not.toBeDisabled();
  });

  test('Successful reward claim updates UI', async () => {
    // Mock successful verification
    mockMiniKit.commands.verify.mockResolvedValue({
      status: 'success',
      proof: { merkle_root: '0x123' },
      isHuman: true
    });

    // Mock successful payment
    mockMiniKit.commands.pay.mockResolvedValue({
      status: 'success',
      transactionHash: '0xabc123'
    });

    // Mock health data with goals met
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: 12000,
        exerciseMinutes: 40,
        calories: 500,
        lastSync: new Date().toISOString(),
      }),
    });

    render(<Home />);
    
    // First verify the user
    const verifyButton = screen.getByText(/Verify with World ID/i);
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(mockMiniKit.commands.verify).toHaveBeenCalled();
    });

    // Wait for health data and claim button to be ready
    await waitFor(() => {
      const claimButton = screen.getByRole('button', { name: /claim.*reward/i });
      expect(claimButton).not.toBeDisabled();
    });

    // Click claim button
    const claimButton = screen.getByRole('button', { name: /claim.*reward/i });
    fireEvent.click(claimButton);

    // Verify payment was attempted
    await waitFor(() => {
      expect(mockMiniKit.commands.pay).toHaveBeenCalledWith({
        to: expect.any(String),
        tokens: [{
          symbol: 'WLD',
          token_amount: '1.0'
        }],
        description: 'Daily fitness reward - 12000 steps, 40 minutes exercise'
      });
    });
  });

  test('Error handling for failed verification', async () => {
    // Mock failed verification
    mockMiniKit.commands.verify.mockResolvedValue({
      status: 'error',
      error: 'Verification failed'
    });

    render(<Home />);
    
    const verifyButton = screen.getByText(/Verify with World ID/i);
    fireEvent.click(verifyButton);
    
    await waitFor(() => {
      expect(mockMiniKit.commands.verify).toHaveBeenCalled();
    });

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
  });

  test('Error handling for failed health data fetch', async () => {
    // Mock failed fetch
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<Home />);
    
    // Error state should be displayed
    await waitFor(() => {
      expect(screen.getByText(/error.*health data/i)).toBeInTheDocument();
    });
  });

  test('Streak counter displays correctly', async () => {
    // Mock API response with streak data
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          steps: 11000,
          exerciseMinutes: 30,
          calories: 400,
          lastSync: new Date().toISOString(),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          streak: 7,
          totalClaimed: 8.5,
          lastClaim: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        }),
      });

    render(<Home />);
    
    // Wait for streak data to load
    await waitFor(() => {
      expect(screen.getByText(/streak.*7/i)).toBeInTheDocument();
    });
  });

  test('Cooldown period prevents premature claims', async () => {
    // Mock API response indicating recent claim
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          steps: 11000,
          exerciseMinutes: 30,
          calories: 400,
          lastSync: new Date().toISOString(),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          streak: 3,
          totalClaimed: 4.0,
          lastClaim: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        }),
      });

    render(<Home />);
    
    // Claim button should be disabled due to cooldown
    await waitFor(() => {
      const claimButton = screen.getByRole('button', { name: /claim.*reward/i });
      expect(claimButton).toBeDisabled();
    });

    // Should show cooldown message
    expect(screen.getByText(/hours.*until.*next.*claim/i)).toBeInTheDocument();
  });

  test('Progress bars display correct percentages', async () => {
    // Mock health data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        steps: 7500, // 75% of 10k goal
        exerciseMinutes: 22, // 73% of 30min goal
        calories: 300,
        lastSync: new Date().toISOString(),
      }),
    });

    render(<Home />);
    
    // Wait for progress bars to render
    await waitFor(() => {
      // Check steps progress (75%)
      const stepsProgress = screen.getByRole('progressbar', { name: /steps/i });
      expect(stepsProgress).toHaveAttribute('value', '7500');
      expect(stepsProgress).toHaveAttribute('max', '10000');
      
      // Check exercise progress (73%)
      const exerciseProgress = screen.getByRole('progressbar', { name: /exercise/i });
      expect(exerciseProgress).toHaveAttribute('value', '22');
      expect(exerciseProgress).toHaveAttribute('max', '30');
    });
  });

  test('Responsive design shows mobile layout', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<Home />);
    
    // Check for mobile-specific classes or elements
    const mainContainer = screen.getByRole('main');
    expect(mainContainer).toHaveClass('max-w-lg'); // Mobile container class
  });

  test('Accessibility: proper ARIA labels and roles', async () => {
    render(<Home />);
    
    // Check for proper accessibility attributes
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
    
    // Progress bars should have proper labels
    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-label');
      });
    });
  });
});
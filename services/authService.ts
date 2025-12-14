import { User } from '../types';

const SESSION_KEY = 'TIMECAPSULE_SESSION';

// Mock authentication that simulates a backend response
export const loginUser = async (username: string): Promise<User> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real app, this would validate against a DB.
  // Here we generate a deterministic ID based on the username to simulate a specific account.
  const mockUser: User = {
    id: `usr_${btoa(username).substring(0, 10)}`, // Create a "unique" ID from username
    username: username,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
    bio: "Data runner navigating the neon stream." // Default bio
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
  return mockUser;
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getStoredSession = (): User | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const updateUserSession = (updatedUser: User): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
};
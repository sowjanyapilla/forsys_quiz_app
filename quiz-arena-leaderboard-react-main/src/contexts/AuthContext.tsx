import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_admin: boolean;
  employee_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface SignupData {
  employee_id: string;
  full_name: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('quiz_token');
    const savedUser = localStorage.getItem('quiz_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        console.error('Login failed');
        return false;
      }

      const data = await response.json();

      const loggedInUser: User = {
        id: data.id,
        email: email,
        username: data.name,
        full_name: data.name,
        is_admin: data.is_admin,
        employee_id: data.employee_id,
      };

      setUser(loggedInUser);
      setToken(data.access_token);
      localStorage.setItem('quiz_token', data.access_token);
      localStorage.setItem('quiz_user', JSON.stringify(loggedInUser));

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        // console.error('Signup failed');
        // return false;
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      return true;
    } catch (error) {
      // console.error('Signup error:', error);
      // return false;
      console.error('Signup error:', error.message);
      throw error; // re-throw to catch in `Signup.tsx`
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');

    window.location.replace("/");
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: !!user?.is_admin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

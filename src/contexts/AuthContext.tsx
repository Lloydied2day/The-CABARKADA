import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthday?: string;
  age?: number;
  gender?: string;
  mobileNumber?: string;
  email: string;
  purok?: string;
  street?: string;
  barangay?: string;
  parentName?: string;
  parentContact?: string;
  interests: string[];
  profilePicture?: string;
  hasSelectedInterests: boolean;
  role: "member" | "admin";
  adminType?: "Youth Organizer" | "SK Official" | "Barangay Admin" | "System Admin";
  organizationName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => void;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateInterests: (interests: string[]) => Promise<void>;
  setInterestsSelected: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("cabarkada_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        const userData = { ...data.user, hasSelectedInterests: true };
        setUser(userData);
        localStorage.setItem("cabarkada_user", JSON.stringify(userData));
        localStorage.setItem("cabarkada_token", data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const loginAsGuest = () => {
    const guestUser: User = {
      id: 0,
      firstName: "Guest",
      lastName: "User",
      email: "guest@example.com",
      interests: [],
      hasSelectedInterests: true,
      role: "member",
    };
    setUser(guestUser);
    localStorage.setItem("cabarkada_user", JSON.stringify(guestUser));
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        const userData = { ...data.user, hasSelectedInterests: true };
        setUser(userData);
        localStorage.setItem("cabarkada_user", JSON.stringify(userData));
        localStorage.setItem("cabarkada_token", data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (response.ok) {
        const userData = { ...data.user, hasSelectedInterests: false };
        setUser(userData);
        localStorage.setItem("cabarkada_user", JSON.stringify(userData));
        localStorage.setItem("cabarkada_token", data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cabarkada_user");
    localStorage.removeItem("cabarkada_token");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("cabarkada_user", JSON.stringify(updatedUser));
    }
  };

  const updateInterests = async (interests: string[]) => {
    if (user) {
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            mobileNumber: user.mobileNumber,
            barangay: user.barangay,
            interests: interests
          }),
        });
        if (response.ok) {
          const updatedUser = { ...user, interests, hasSelectedInterests: true };
          setUser(updatedUser);
          localStorage.setItem("cabarkada_user", JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error("Failed to update interests:", error);
      }
    }
  };

  const setInterestsSelected = () => {
    if (user) {
      const updatedUser = { ...user, hasSelectedInterests: true };
      setUser(updatedUser);
      localStorage.setItem("cabarkada_user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAsGuest, loginAdmin, register, logout, updateUser, updateInterests, setInterestsSelected }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

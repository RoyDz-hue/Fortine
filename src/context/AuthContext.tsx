import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

console.log("[AuthContext] File loaded. Supabase client imported:", supabase ? "OK" : "Failed or not available at import time");

// Helper function to generate a more robust referral code
const generateReferralCode = (prefix = "TRAD", length = 8): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: async () => { throw new Error("Login function not implemented"); },
  register: async () => { throw new Error("Register function not implemented"); },
  logout: async () => { throw new Error("Logout function not implemented"); },
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("[AuthProvider] Component rendering/initializing...");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthProvider] useEffect triggered. Attempting to check user session.");
    const checkUser = async () => {
      console.log("[AuthProvider] checkUser: Starting execution.");
      try {
        console.log("[AuthProvider] checkUser: Attempting supabase.auth.getSession(). Supabase client:", supabase ? "Available" : "NOT AVAILABLE");
        if (!supabase || !supabase.auth) {
            console.error("[AuthProvider] checkUser: Supabase client or supabase.auth is not available. Cannot get session.");
            setIsLoading(false);
            return;
        }
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthProvider] checkUser: supabase.auth.getSession() error:", error.message);
          setIsLoading(false);
          return;
        }
        
        console.log("[AuthProvider] checkUser: supabase.auth.getSession() successful. Session data:", data.session);

        if (data.session) {
          console.log("[AuthProvider] checkUser: Active session found for user:", data.session.user.email);
          console.log("[AuthProvider] checkUser: Attempting to fetch user profile from 'users' table for ID:", data.session.user.id);
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          if (userError) {
            console.error("[AuthProvider] checkUser: Error fetching user data from 'users' table:", userError.message);
            setIsLoading(false);
            return;
          }

          if (userData) {
            console.log("[AuthProvider] checkUser: User profile data fetched successfully:", userData);
            setUser({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              role: userData.role || "user",
              status: userData.status || "active",
              referralCode: userData.referral_code,
              referralBalance: userData.referral_balance || 0,
              referralCount: userData.referral_count || 0,
            });
          } else {
            console.warn("[AuthProvider] checkUser: User session active, but no corresponding user data found in 'users' table for ID:", data.session.user.id);
          }
        } else {
          console.log("[AuthProvider] checkUser: No active session found.");
        }
      } catch (error: any) {
        console.error("[AuthProvider] checkUser: Caught an exception during execution:", error.message, error.stack);
      } finally {
        console.log("[AuthProvider] checkUser: Execution finished. Setting isLoading to false.");
        setIsLoading(false);
      }
    };

    checkUser();
    
    console.log("[AuthProvider] useEffect: Setting up onAuthStateChange listener. Supabase client:", supabase ? "Available" : "NOT AVAILABLE");
    if (!supabase || !supabase.auth) {
        console.error("[AuthProvider] useEffect: Supabase client or supabase.auth is not available. Cannot set up listener.");
        // setIsLoading(false); // Already handled by checkUser, but ensure loading state is false if we can't proceed.
        return;
    }
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthProvider] onAuthStateChange: Event received:", event, "Session user:", session ? session.user.email : null);
        if (session && session.user) {
          console.log("[AuthProvider] onAuthStateChange: Session exists. Fetching user profile for ID:", session.user.id);
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("[AuthProvider] onAuthStateChange: Error fetching user data:", error.message);
            return;
          }

          if (userData) {
            console.log("[AuthProvider] onAuthStateChange: User profile data fetched:", userData);
            setUser({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              role: userData.role || "user",
              status: userData.status || "active",
              referralCode: userData.referral_code,
              referralBalance: userData.referral_balance || 0,
              referralCount: userData.referral_count || 0,
            });
          } else {
             console.warn("[AuthProvider] onAuthStateChange: Auth session exists, but no user data found in 'users' table for ID:", session.user.id);
          }
        } else {
          console.log("[AuthProvider] onAuthStateChange: No session or user. Setting user to null.");
          setUser(null);
        }
      }
    );
    console.log("[AuthProvider] useEffect: onAuthStateChange listener set up.");

    return () => {
      if (authListener && authListener.subscription) {
        console.log("[AuthProvider] useEffect cleanup: Unsubscribing from auth state changes.");
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    // ... (rest of the login function with its existing logs)
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }
    try {
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error.message);
        throw new Error(error.message || 'Login failed. Please check your credentials.');
      }
      
      console.log("Login successful for:", data?.user?.email);
    } catch (error: any) {
      console.error("Caught login exception:", error.message);
      throw new Error(error.message || 'An unexpected error occurred during login.');
    }
  };

  const register = async (username: string, email: string, password: string, referralCodeInput?: string) => {
    // ... (rest of the register function with its existing logs)
    if (!username || !email || !password) {
      throw new Error("Username, email, and password are required.");
    }
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            username: username,
          },
        },
      });

      if (signUpError) {
        console.error("Supabase sign-up error:", signUpError.message);
        throw new Error(signUpError.message || 'Registration failed.');
      }

      if (!signUpData.user) {
        console.error("User object not returned after sign-up.");
        throw new Error('Registration succeeded but user data is missing.');
      }
      
      console.log("Supabase sign-up successful for:", signUpData.user.email);

      const newUserId = signUpData.user.id;
      const generatedReferralCode = generateReferralCode();
      const userRole = email.toLowerCase() === 'cyntoremix@gmail.com' ? 'admin' : 'user';
      let referredById = null;

      if (referralCodeInput) {
        const referrerId = await getReferrerId(referralCodeInput);
        if (referrerId) {
          referredById = referrerId;
        } else {
          console.warn(`Referral code "${referralCodeInput}" provided during registration was not found.`);
        }
      }

      const { error: profileError } = await supabase.from('users').insert([
        {
          id: newUserId,
          username,
          email: email.toLowerCase(), 
          role: userRole,
          referral_code: generatedReferralCode,
          referred_by: referredById,
        },
      ]);

      if (profileError) {
        console.error("Error creating user profile:", profileError.message);
        throw new Error(profileError.message || 'Failed to create user profile after registration.');
      }
      
      console.log(`User profile created for ${email} with role ${userRole} and referral code ${generatedReferralCode}`);

      if (referredById && referralCodeInput) {
        await processReferral(newUserId, referralCodeInput, referredById); 
      }

    } catch (error: any) {
      console.error("Caught registration exception:", error.message);
      throw new Error(error.message || 'An unexpected error occurred during registration.');
    }
  };

  const getReferrerId = async (referralCode: string): Promise<string | null> => {
    // ... (rest of the getReferrerId function with its existing logs)
    if (!referralCode) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
        
      if (error) {
        console.warn(`Error fetching referrer ID for code "${referralCode}":`, error.message);
        return null;
      }
      return data ? data.id : null;
    } catch (e: any) {
      console.error(`Exception in getReferrerId for code "${referralCode}":`, e.message);
      return null;
    }
  };

  const processReferral = async (newUserId: string, referralCode: string, referrerId: string) => {
    // ... (rest of the processReferral function with its existing logs)
    console.log(`Processing referral for new user ${newUserId} referred by ${referrerId} using code ${referralCode}`);
    try {
      const { data: settings, error: settingsError } = await supabase
        .from('referral_settings')
        .select('*') 
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
          
      if (settingsError || !settings) {
        console.error("Referral settings not found or error fetching them:", settingsError?.message);
        return; 
      }
      
      const directRewardAmount = settings.coins_per_referral || 0;

      const { error: updateL1Error } = await supabase.rpc('process_direct_referral_reward', {
        p_referrer_id: referrerId,
        p_reward_amount: directRewardAmount,
        p_new_user_id: newUserId 
      });

      if (updateL1Error) {
        console.error("Failed to update direct referrer (L1) via RPC:", updateL1Error.message);
      } else {
         console.log(`Direct referral reward processed for referrer ${referrerId}`);
      }
      
      const { error: transactionL1Error } = await supabase
        .from('referral_transactions') 
        .insert({
          user_id: referrerId, 
          referred_user_id: newUserId, 
          transaction_type: 'referral_reward_l1',
          amount: directRewardAmount,
          currency: 'TDC', 
          reason: `Direct referral reward for new user ${newUserId}`,
          status: 'completed'
        });
          
      if (transactionL1Error) {
        console.error("Failed to create L1 referral transaction:", transactionL1Error.message);
      }

      if (settings.level2_rate_percent && settings.level2_rate_percent > 0) {
        const { data: level1ReferrerData, error: fetchL1Error } = await supabase
          .from('users')
          .select('referred_by') 
          .eq('id', referrerId) 
          .single();
          
        if (fetchL1Error || !level1ReferrerData || !level1ReferrerData.referred_by) {
          console.log("L1 referrer has no referrer (no L2 referrer), or error fetching:", fetchL1Error?.message);
        } else {
          const level2ReferrerId = level1ReferrerData.referred_by;
          const level2RewardAmount = directRewardAmount * (settings.level2_rate_percent / 100);

          if (level2RewardAmount > 0) {
            const { error: updateL2Error } = await supabase.rpc('process_indirect_referral_reward', {
                p_referrer_id: level2ReferrerId,
                p_reward_amount: level2RewardAmount,
                p_original_new_user_id: newUserId, 
                p_intermediate_referrer_id: referrerId 
            });

            if (updateL2Error) {
              console.error("Failed to update L2 referrer via RPC:", updateL2Error.message);
            } else {
              console.log(`Indirect (L2) referral reward processed for referrer ${level2ReferrerId}`);
            }

            const { error: transactionL2Error } = await supabase
              .from('referral_transactions')
              .insert({
                user_id: level2ReferrerId,
                referred_user_id: newUserId, 
                intermediate_referrer_id: referrerId,
                transaction_type: 'referral_reward_l2',
                amount: level2RewardAmount,
                currency: 'TDC',
                reason: `Indirect (L2) referral reward for new user ${newUserId} via ${referrerId}`,
                status: 'completed'
              });
            if (transactionL2Error) {
              console.error("Failed to create L2 referral transaction:", transactionL2Error.message);
            }
          }
        }
      }
    } catch (e: any) {
      console.error("Exception in processReferral:", e.message, e.stack);
    }
  };

  const logout = async () => {
    console.log("[AuthProvider] logout: Attempting to sign out.");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AuthProvider] logout: Error signing out:", error.message);
        throw new Error(error.message || 'Logout failed.');
      }
      console.log("[AuthProvider] logout: Sign out successful. User set to null.");
      setUser(null); // Explicitly set user to null after successful sign out
    } catch (error: any) {
      console.error("[AuthProvider] logout: Caught an exception during sign out:", error.message);
      throw new Error(error.message || 'An unexpected error occurred during logout.');
    }
  };

  console.log("[AuthProvider] Current state before return: isLoading:", isLoading, "isAuthenticated:", !!user, "User email:", user?.email);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin: user?.role === "admin", isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;


import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

// Helper function to generate a more robust referral code
const generateReferralCode = (prefix = "TRAD", length = 8): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Using uppercase for better readability
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
  login: async () => { throw new Error('Login function not implemented'); },
  register: async () => { throw new Error('Register function not implemented'); },
  logout: async () => { throw new Error('Logout function not implemented'); },
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking for existing session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error.message);
          setIsLoading(false);
          return;
        }
        
        if (data.session) {
          console.log("Session found for user:", data.session.user.email);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (userError) {
            console.error("Error fetching user data during session check:", userError.message);
            // Optionally, sign out the user if their profile data is missing or corrupt
            // await supabase.auth.signOut(); 
            // setUser(null);
            setIsLoading(false);
            return;
          }

          if (userData) {
            setUser({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              role: userData.role || 'user',
              status: userData.status || 'active',
              referralCode: userData.referral_code,
              referralBalance: userData.referral_balance || 0,
              referralCount: userData.referral_count || 0,
            });
          } else {
            // This case might indicate an issue, e.g., auth user exists but no profile in 'users' table
            console.warn("User session active, but no corresponding user data found in 'users' table.");
            // await supabase.auth.signOut(); // Consider signing out to prevent inconsistent state
            // setUser(null);
          }
        } else {
          console.log("No active session found.");
        }
      } catch (error: any) {
        console.error("Error during initial auth check:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed. Event:", event, "Session:", session ? session.user.email : null);
        if (session && session.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("Error fetching user data on auth state change:", error.message);
            // Potentially clear user state if profile fetch fails
            // setUser(null);
            return;
          }

          if (userData) {
            setUser({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              role: userData.role || 'user',
              status: userData.status || 'active',
              referralCode: userData.referral_code,
              referralBalance: userData.referral_balance || 0,
              referralCount: userData.referral_count || 0,
            });
          } else {
             console.warn("Auth session exists, but no user data found in 'users' table for ID:", session.user.id);
             // setUser(null); // Or handle as an error state
          }
        } else {
          setUser(null);
        }
        // setIsLoading(false); // Already handled by initial checkUser, but can be set here if needed for specific flows
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        console.log("Unsubscribing from auth state changes.");
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
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
        // Provide more user-friendly error messages based on Supabase error codes if possible
        throw new Error(error.message || 'Login failed. Please check your credentials.');
      }
      
      console.log("Login successful for:", data?.user?.email);
      // Auth state listener will update the user state and fetch profile data
    } catch (error: any) {
      console.error("Caught login exception:", error.message);
      throw new Error(error.message || 'An unexpected error occurred during login.');
    }
  };

  const register = async (username: string, email: string, password: string, referralCodeInput?: string) => {
    if (!username || !email || !password) {
      throw new Error("Username, email, and password are required.");
    }
    // Add more validation if needed (e.g., email format, password strength)
    // Consider using a validation library like Zod for more complex validation

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { // Data to be stored in auth.users.raw_user_meta_data (accessible during triggers/functions)
            username: username, // Store username here if needed by auth triggers
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
          // Decide if registration should fail or proceed without referral if code is invalid
          // For now, it proceeds without referral if code is invalid.
        }
      }

      const { error: profileError } = await supabase.from('users').insert([
        {
          id: newUserId,
          username,
          email: email.toLowerCase(), // Store email in lowercase for consistency
          role: userRole,
          referral_code: generatedReferralCode,
          referred_by: referredById,
          // Other fields like referral_balance, referral_count will default to 0 or as per DB schema
        },
      ]);

      if (profileError) {
        console.error("Error creating user profile:", profileError.message);
        // IMPORTANT: Consider how to handle this. If profile creation fails, the auth user exists but profile doesn't.
        // This could lead to an inconsistent state. Options:
        // 1. Attempt to delete the auth user: await supabase.auth.admin.deleteUser(newUserId) (requires admin privileges)
        // 2. Inform user and ask to contact support.
        throw new Error(profileError.message || 'Failed to create user profile after registration.');
      }
      
      console.log(`User profile created for ${email} with role ${userRole} and referral code ${generatedReferralCode}`);

      if (referredById && referralCodeInput) {
        // It's important that processReferral is robust and handles its own errors gracefully
        await processReferral(newUserId, referralCodeInput, referredById); 
      }
      // Note: Supabase might send a confirmation email. User state will be updated by onAuthStateChange.

    } catch (error: any) {
      console.error("Caught registration exception:", error.message);
      throw new Error(error.message || 'An unexpected error occurred during registration.');
    }
  };

  const getReferrerId = async (referralCode: string): Promise<string | null> => {
    if (!referralCode) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        // .neq('id', potentialNewUserId) // Prevent self-referral if new user ID is available here
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

  // Modified to accept referrerId directly to avoid a redundant DB call
  const processReferral = async (newUserId: string, referralCode: string, referrerId: string) => {
    console.log(`Processing referral for new user ${newUserId} referred by ${referrerId} using code ${referralCode}`);
    try {
      // Get the current referral settings (e.g., coins per referral, multi-level rates)
      // This assumes a 'referral_settings' table exists and has relevant data.
      const { data: settings, error: settingsError } = await supabase
        .from('referral_settings')
        .select('*') // Select specific columns like 'coins_per_referral', 'level2_rate_percent'
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
          
      if (settingsError || !settings) {
        console.error("Referral settings not found or error fetching them:", settingsError?.message);
        // Decide if referral processing should halt or use default values
        return; // Halting for now if settings are missing
      }
      
      const directRewardAmount = settings.coins_per_referral || 0;

      // Update direct referrer's (Level 1) referral count and balance
      // Assumes Supabase RPC functions 'increment_user_metric(user_id_in, metric_name_in, increment_value_in)' 
      // and 'add_to_user_balance(user_id_in, amount_in, currency_in)' exist for atomic updates.
      // Using .rpc for atomic updates is generally preferred over read-modify-write from client.
      // For simplicity, if direct update is used:
      // const { data: referrerData, error: fetchReferrerError } = await supabase.from('users').select('referral_count, referral_balance').eq('id', referrerId).single();
      // if (fetchReferrerError || !referrerData) { /* handle error */ return; }
      // const newReferralCount = (referrerData.referral_count || 0) + 1;
      // const newReferralBalance = (referrerData.referral_balance || 0) + directRewardAmount;
      // await supabase.from('users').update({ referral_count: newReferralCount, referral_balance: newReferralBalance }).eq('id', referrerId);

      // Using a hypothetical RPC for incrementing count and adding balance:
      const { error: updateL1Error } = await supabase.rpc('process_direct_referral_reward', {
        p_referrer_id: referrerId,
        p_reward_amount: directRewardAmount,
        p_new_user_id: newUserId // Optional: for logging or linking the referral
      });

      if (updateL1Error) {
        console.error("Failed to update direct referrer (L1) via RPC:", updateL1Error.message);
        // Log this error, but might not need to halt entire process if L2 can still proceed or if non-critical
      } else {
         console.log(`Direct referral reward processed for referrer ${referrerId}`);
      }
      
      // Add a referral transaction record for the direct referrer
      const { error: transactionL1Error } = await supabase
        .from('referral_transactions') // Assumes 'referral_transactions' table exists
        .insert({
          user_id: referrerId, // The user receiving the reward
          referred_user_id: newUserId, // The new user who was referred
          transaction_type: 'referral_reward_l1',
          amount: directRewardAmount,
          currency: 'TDC', // Assuming TDC coin
          reason: `Direct referral reward for new user ${newUserId}`,
          status: 'completed'
        });
          
      if (transactionL1Error) {
        console.error("Failed to create L1 referral transaction:", transactionL1Error.message);
      }

      // Process level 2 referral if applicable and settings exist
      if (settings.level2_rate_percent && settings.level2_rate_percent > 0) {
        const { data: level1ReferrerData, error: fetchL1Error } = await supabase
          .from('users')
          .select('referred_by') // This is the ID of the L2 referrer
          .eq('id', referrerId) // ID of the L1 referrer
          .single();
          
        if (fetchL1Error || !level1ReferrerData || !level1ReferrerData.referred_by) {
          console.log("L1 referrer has no referrer (no L2 referrer), or error fetching:", fetchL1Error?.message);
        } else {
          const level2ReferrerId = level1ReferrerData.referred_by;
          const level2RewardAmount = directRewardAmount * (settings.level2_rate_percent / 100);

          if (level2RewardAmount > 0) {
            // Using a hypothetical RPC for L2 reward:
            const { error: updateL2Error } = await supabase.rpc('process_indirect_referral_reward', {
                p_referrer_id: level2ReferrerId,
                p_reward_amount: level2RewardAmount,
                p_original_new_user_id: newUserId, // For tracking
                p_intermediate_referrer_id: referrerId // For tracking
            });

            if (updateL2Error) {
              console.error("Failed to update L2 referrer via RPC:", updateL2Error.message);
            } else {
              console.log(`Indirect (L2) referral reward processed for referrer ${level2ReferrerId}`);
            }

            // Add a level 2 referral transaction record
            const { error: transactionL2Error } = await supabase
              .from('referral_transactions')
              .insert({
                user_id: level2ReferrerId,
                referred_user_id: newUserId, // The new user who ultimately caused this reward
                intermediate_referrer_id: referrerId, // The L1 referrer
                transaction_type: 'referral_reward_l2',
                amount: level2RewardAmount,
                currency: 'TDC', // Assuming TDC coin
                reason: `Indirect (L2) referral reward from new user ${newUserId}`,
                status: 'completed'
              });
              
            if (transactionL2Error) {
              console.error("Failed to create L2 referral transaction:", transactionL2Error.message);
            }
          }
        }
      }
    } catch (e: any) {
      console.error("Exception in processReferral:", e.message);
      // This function should not throw errors that break the registration flow if possible.
      // Log errors and continue.
    }
  };

  const logout = async () => {
    try {
      console.log("Attempting logout...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error.message);
        throw new Error(error.message || 'Logout failed.');
      }
      setUser(null); // Clear user state immediately
      console.log("Logout successful.");
    } catch (error: any) {
      console.error("Caught logout exception:", error.message);
      throw new Error(error.message || 'An unexpected error occurred during logout.');
    }
  };

  const isAuthenticated = !!user && !isLoading; // Ensure not authenticated while initial loading
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;


import { supabase } from "@/integrations/supabase/client";
import {
  ReferralStats,
  ReferralNetwork,
  ReferralSettings,
  ReferralTransaction
} from "@/types";

// Helper to get current user ID, reducing repetitive calls
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("Error fetching user or user not authenticated:", error?.message);
    throw new Error("User not authenticated. Please log in again.");
  }
  return user.id;
};

/**
 * Get current user's referral statistics
 */
export const getUserReferralStats = async (): Promise<ReferralStats> => {
  try {
    const userId = await getCurrentUserId();

    // Get user's basic referral info
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("referral_code, referral_balance, referral_count")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user referral data:", userError.message);
      throw new Error(`Failed to fetch referral data: ${userError.message}`);
    }
    if (!userData) {
        throw new Error("User referral data not found.");
    }

    // Get direct referrals count
    const { count: directCount, error: directError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", userId);

    if (directError) {
      console.error("Error fetching direct referral count:", directError.message);
      throw new Error(`Failed to fetch direct referral count: ${directError.message}`);
    }

    // Get indirect referrals
    const { data: directReferrals, error: directRefError } = await supabase
      .from("users")
      .select("id")
      .eq("referred_by", userId);

    if (directRefError) {
      console.error("Error fetching direct referral IDs for indirect count:", directRefError.message);
      throw new Error(`Failed to fetch direct referrals for indirect count: ${directRefError.message}`);
    }

    let indirectCount = 0;
    if (directReferrals && directReferrals.length > 0) {
      const directIds = directReferrals.map(ref => ref.id);
      const { count: indirectCountResult, error: indirectError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .in("referred_by", directIds);

      if (indirectError) {
        console.error("Error fetching indirect referral count:", indirectError.message);
        throw new Error(`Failed to fetch indirect referral count: ${indirectError.message}`);
      }
      indirectCount = indirectCountResult || 0;
    }

    // Get total earned from transactions
    const { data: transactionsData, error: txError } = await supabase
      .from("referral_transactions")
      .select("*") // Consider selecting only necessary columns
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (txError) {
      console.error("Error fetching referral transactions:", txError.message);
      throw new Error(`Failed to fetch referral transactions: ${txError.message}`);
    }

    const totalEarned = transactionsData
      ? transactionsData
        .filter(tx => ["referral_reward", "referral_reward_l2", "transfer_in", "admin_adjustment_add"].includes(tx.transaction_type))
        .reduce((sum, tx) => sum + (tx.amount || 0), 0) // Ensure amount is a number
      : 0;

    return {
      referralCode: userData.referral_code || "N/A",
      referralBalance: userData.referral_balance || 0,
      directReferrals: directCount || 0,
      indirectReferrals: indirectCount,
      totalEarned,
      transferHistory: transactionsData?.map((tx): ReferralTransaction => ({
        id: tx.id,
        userId: tx.user_id,
        transactionType: tx.transaction_type,
        amount: tx.amount || 0,
        currency: tx.currency || "TDC", // Add default currency if missing
        fee: tx.fee || 0,
        recipientId: tx.recipient_id,
        recipientAddress: tx.recipient_address,
        reason: tx.reason,
        status: tx.status || "unknown",
        createdAt: tx.created_at,
        updatedAt: tx.updated_at, // Ensure this field exists in your type or DB
        createdBy: tx.created_by, // Ensure this field exists in your type or DB
        referredUserId: tx.referred_user_id, // Ensure this field exists
        intermediateReferrerId: tx.intermediate_referrer_id // Ensure this field exists
      })) || []
    };
  } catch (error: any) {
    console.error("Error in getUserReferralStats:", error.message);
    throw error; // Re-throw the error to be handled by the caller
  }
};

/**
 * Get user's referral network
 */
export const getUserReferralNetwork = async (): Promise<ReferralNetwork> => {
  try {
    const userId = await getCurrentUserId();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, username, referral_code") // Added username
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching current user data for network:", userError?.message);
      throw new Error(userError?.message || "User not found for referral network.");
    }

    const { data: directReferralsData, error: directError } = await supabase
      .from("users")
      .select("id, email, username, created_at")
      .eq("referred_by", userId);

    if (directError) {
      console.error("Error fetching direct referrals for network:", directError.message);
      throw new Error(`Failed to fetch direct referrals: ${directError.message}`);
    }

    const formattedDirectReferrals = await Promise.all((directReferralsData || []).map(async (ref) => {
      // Optimized: Fetch reward for this specific referred user by the current user
      // This query might be too specific if reason is not always exact. Consider linking via referred_user_id.
      const { data: txData, error: txError } = await supabase
        .from("referral_transactions")
        .select("amount")
        .eq("user_id", userId) // The current user who received the reward
        .eq("referred_user_id", ref.id) // The user who was referred
        .eq("transaction_type", "referral_reward_l1") // More specific type
        .maybeSingle(); // Use maybeSingle if a transaction might not exist

      if (txError) {
        console.warn(`Could not fetch L1 reward transaction for referred user ${ref.id}: ${txError.message}`);
      }

      return {
        id: ref.id,
        email: ref.email,
        username: ref.username || "N/A",
        joinDate: ref.created_at,
        coinsEarned: txData?.amount || 0
      };
    }));

    let indirectReferrals: ReferralNetwork["indirectReferrals"] = [];
    if (directReferralsData && directReferralsData.length > 0) {
      const directIds = directReferralsData.map(ref => ref.id);
      const { data: indirectUsersData, error: indirectError } = await supabase
        .from("users")
        .select("id, email, username, referred_by, created_at")
        .in("referred_by", directIds);

      if (indirectError) {
        console.error("Error fetching indirect referrals for network:", indirectError.message);
        throw new Error(`Failed to fetch indirect referrals: ${indirectError.message}`);
      }

      indirectReferrals = await Promise.all((indirectUsersData || []).map(async (ref) => {
        // Optimized: Fetch L2 reward for this specific indirectly referred user by the current user
        const { data: txData, error: txError } = await supabase
          .from("referral_transactions")
          .select("amount")
          .eq("user_id", userId) // The current user who received the L2 reward
          .eq("referred_user_id", ref.id) // The user who was indirectly referred
          .eq("intermediate_referrer_id", ref.referred_by) // The L1 referrer who linked them
          .eq("transaction_type", "referral_reward_l2") // More specific type
          .maybeSingle();

        if (txError) {
          console.warn(`Could not fetch L2 reward transaction for referred user ${ref.id}: ${txError.message}`);
        }
        return {
          id: ref.id,
          email: ref.email,
          username: ref.username || "N/A",
          referredBy: ref.referred_by || "N/A",
          joinDate: ref.created_at,
          coinsEarned: txData?.amount || 0
        };
      }));
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        username: userData.username || "N/A",
        referralCode: userData.referral_code || "N/A"
      },
      directReferrals: formattedDirectReferrals,
      indirectReferrals
    };
  } catch (error: any) {
    console.error("Error in getUserReferralNetwork:", error.message);
    throw error;
  }
};

/**
 * Get current referral settings (globally applicable)
 */
export const getReferralSettings = async (): Promise<ReferralSettings> => {
  try {
    const { data, error } = await supabase
      .from("referral_settings")
      .select("*") // Select all columns as defined in ReferralSettings type
      .order("created_at", { ascending: false }) // Get the latest settings
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching referral settings:", error.message);
      throw new Error(`Failed to fetch referral settings: ${error.message}`);
    }
    if (!data) {
        throw new Error("No referral settings found in the database.");
    }

    return {
      id: data.id,
      coinsPerReferral: data.coins_per_referral || 0,
      level2RatePercent: data.level2_rate_percent || 0,
      transactionFeePercent: data.transaction_fee_percent || 0,
      minTransferableBalance: data.min_transferable_balance || 0,
      minToCryptoWallet: data.min_to_crypto_wallet || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at
      // Ensure all fields from type ReferralSettings are mapped
    };
  } catch (error: any) {
    console.error("Error in getReferralSettings:", error.message);
    throw error;
  }
};

/**
 * Transfer referral coins to another user via email
 * This relies on a Supabase RPC function: `transfer_referral_coins`
 */
export const transferCoins = async (recipientEmail: string, amount: number): Promise<any> => {
  try {
    const userId = await getCurrentUserId();

    if (!recipientEmail || typeof amount !== "number" || amount <= 0) {
      throw new Error("Invalid recipient email or amount for transfer.");
    }

    // The RPC function should handle balance checks, fees, and transaction logging atomically.
    const { data, error } = await supabase.rpc("transfer_referral_coins", {
      p_sender_id: userId,
      p_recipient_email: recipientEmail.toLowerCase(), // Standardize email
      p_transfer_amount: amount
    });

    if (error) {
      console.error("Error during transferCoins RPC call:", error.message);
      // Provide more specific error messages based on RPC error if possible
      throw new Error(error.message || "Coin transfer failed.");
    }
    
    console.log("Transfer successful:", data);
    return data; // Return data from RPC, which might include transaction ID or status
  } catch (error: any) {
    console.error("Error in transferCoins:", error.message);
    throw error;
  }
};

/**
 * Update referral settings (admin only)
 */
export const updateReferralSettings = async (settings: Partial<Omit<ReferralSettings, 'id' | 'createdAt' | 'updatedAt'> & { id: string }>): Promise<ReferralSettings> => {
  try {
    // No need to call getCurrentUserId() if this is an admin-only function where auth is checked by RLS or API gateway
    // However, if called from client-side admin panel, ensure admin role is checked before calling.

    if (!settings.id) {
        throw new Error("Setting ID is required to update referral settings.");
    }

    const updatePayload: any = { ...settings };
    delete updatePayload.id; // id is used in .eq(), not in update payload
    delete updatePayload.createdAt; // Should not be updated by client
    updatePayload.updated_at = new Date().toISOString(); // Set updated_at timestamp

    const { data, error } = await supabase
      .from("referral_settings")
      .update(updatePayload)
      .eq("id", settings.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating referral settings:", error.message);
      throw new Error(`Failed to update referral settings: ${error.message}`);
    }
    if (!data) {
        throw new Error("Failed to update referral settings, no data returned.");
    }

    return {
        id: data.id,
        coinsPerReferral: data.coins_per_referral,
        level2RatePercent: data.level2_rate_percent,
        transactionFeePercent: data.transaction_fee_percent,
        minTransferableBalance: data.min_transferable_balance,
        minToCryptoWallet: data.min_to_crypto_wallet,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
  } catch (error: any) {
    console.error("Error in updateReferralSettings:", error.message);
    throw error;
  }
};

/**
 * Admin function to adjust a user's referral balance
 * This relies on a Supabase RPC function: `admin_adjust_referral_balance`
 */
export const adminAdjustBalance = async (
  targetUserId: string,
  amount: number,
  reason: string
): Promise<any> => {
  try {
    const adminId = await getCurrentUserId(); // Assuming admin must be a logged-in user
    // Add role check here if not handled by RLS or RPC itself
    // const { data: adminData } = await supabase.from('users').select('role').eq('id', adminId).single();
    // if (adminData?.role !== 'admin') throw new Error('Unauthorized: Admin role required.');

    if (!targetUserId || typeof amount !== "number" || !reason) {
      throw new Error("Invalid target user ID, amount, or reason for balance adjustment.");
    }

    const { data, error } = await supabase.rpc("admin_adjust_referral_balance", {
      p_target_user_id: targetUserId,
      p_adjustment_amount: amount,
      p_reason: reason,
      p_admin_id: adminId // Pass admin ID for logging/auditing within RPC
    });

    if (error) {
      console.error("Error during adminAdjustBalance RPC call:", error.message);
      throw new Error(error.message || "Admin balance adjustment failed.");
    }

    console.log("Admin balance adjustment successful:", data);
    return data;
  } catch (error: any) {
    console.error("Error in adminAdjustBalance:", error.message);
    throw error;
  }
};


import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Coins, User, BadgePercent, BadgeCheck, Settings, LogOut, ShieldCheck } from 'lucide-react'; // Added ShieldCheck for Admin
import { useToast } from '@/components/ui/use-toast';

const ProfileDropdown = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log("Logging out user...");
      await logout();
      toast({
        title: "Logged Out Successfully",
        description: "You have been logged out of your account.",
        variant: "default",
      });
      navigate('/'); // Redirect to home page after logout
    } catch (error: any) {
      console.error('Logout error:', error.message);
      toast({
        title: "Logout Failed",
        description: error.message || "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false); // Close dropdown after action
    }
  };

  if (!isAuthenticated || !user) {
    // This case should ideally not be reached if ProfileDropdown is only shown to authenticated users.
    // console.log("ProfileDropdown: User not authenticated or no user data. Not rendering.");
    return null;
  }

  // console.log("ProfileDropdown rendering for user:", user.email, "Admin:", isAdmin);

  const getInitials = () => {
    if (user.username && user.username.length >= 2) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email && user.email.length >= 2) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U'; // Default fallback
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary transition-colors">
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2 shadow-xl rounded-lg" align="end" forceMount>
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold leading-none truncate" title={user.username || user.email}>{user.username || 'User Profile'}</p>
            <p className="text-xs text-muted-foreground truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1" />
        
        {/* Referral Information Section */}
        <DropdownMenuGroup className="px-1">
          <DropdownMenuLabel className="px-1 text-xs text-muted-foreground font-normal">Referrals & Rewards</DropdownMenuLabel>
          <DropdownMenuItem className="cursor-pointer flex items-center text-sm py-1.5 px-2 rounded-md hover:bg-muted focus:bg-muted" asChild>
            <Link to="/dashboard/referrals" className="flex w-full items-center">
              <Coins className="mr-2.5 h-4 w-4 text-yellow-500" />
              <span>TDC Coin Balance: {user.referralBalance?.toFixed(2) || '0.00'}</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer flex items-center text-sm py-1.5 px-2 rounded-md hover:bg-muted focus:bg-muted" asChild>
            <Link to="/dashboard/referrals" className="flex w-full items-center">
              <BadgePercent className="mr-2.5 h-4 w-4 text-blue-500" />
              <span>Referral Code: {user.referralCode || 'N/A'}</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer flex items-center text-sm py-1.5 px-2 rounded-md hover:bg-muted focus:bg-muted" asChild>
            <Link to="/dashboard/referrals" className="flex w-full items-center">
              <BadgeCheck className="mr-2.5 h-4 w-4 text-green-500" />
              <span>Direct Referrals: {user.referralCount || 0}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-1" />
        
        {/* Navigation Section */}
        <DropdownMenuGroup className="px-1">
          <DropdownMenuItem className="cursor-pointer flex items-center text-sm py-1.5 px-2 rounded-md hover:bg-muted focus:bg-muted" asChild>
            <Link to="/dashboard" className="flex w-full items-center">
              <User className="mr-2.5 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer flex items-center text-sm py-1.5 px-2 rounded-md hover:bg-muted focus:bg-muted" asChild>
            <Link to="/dashboard/settings" className="flex w-full items-center">
              <Settings className="mr-2.5 h-4 w-4" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>

          {isAdmin && (
            <DropdownMenuItem className="cursor-pointer flex items-center text-sm py-1.5 px-2 rounded-md hover:bg-muted focus:bg-muted" asChild>
              <Link to="/admin" className="flex w-full items-center">
                <ShieldCheck className="mr-2.5 h-4 w-4 text-red-600" />
                <span className="font-medium">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-1" />
        
        {/* Logout Section */}
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer flex items-center text-sm py-1.5 px-2 rounded-md text-red-600 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-700"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;


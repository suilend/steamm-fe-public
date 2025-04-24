import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreatePoolCard from "@/components/admin/pools/CreatePoolCard";
import { cn } from "@/lib/utils";

interface PoolCreationFormProps {
  className?: string;
  tokenType?: string; // The token type from the previous step
  onBack?: () => void;
  onSuccess?: (poolId: string) => void;
}

/**
 * PoolCreationForm - A wrapper component that styles the existing CreatePoolCard component
 * using the Card component pattern and handles token selection from previous steps.
 */
export default function PoolCreationForm({
  className,
  tokenType,
  onBack,
  onSuccess,
}: PoolCreationFormProps) {
  const router = useRouter();
  const [poolCreated, setPoolCreated] = useState(false);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);

  // Use session storage to persist the token type between navigation
  const savedTokenType = tokenType || (typeof window !== 'undefined' ? sessionStorage.getItem("launchTokenType") : null);
  
  // Store token type in session storage when it's available
  if (typeof window !== 'undefined' && tokenType) {
    sessionStorage.setItem("launchTokenType", tokenType);
  }

  // Listen for pool creation
  useEffect(() => {
    // Check if pool address is already in session storage
    const storedPoolAddress = typeof window !== 'undefined' ? sessionStorage.getItem("launchPoolAddress") : null;
    const storedPoolName = typeof window !== 'undefined' ? sessionStorage.getItem("launchPoolName") : null;
    
    if (storedPoolAddress) {
      setPoolAddress(storedPoolAddress);
    }
    
    // Function to handle pool creation success
    const handlePoolCreated = (event: any) => {
      const newPoolAddress = sessionStorage.getItem("launchPoolAddress");
      const poolName = event.detail?.poolName || sessionStorage.getItem("launchPoolName") || "";
      
      if (newPoolAddress) {
        setPoolAddress(newPoolAddress);
        
        // Also call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(newPoolAddress);
        }
      }
    };
    
    // Listen for the pool creation success event
    window.addEventListener("pool-created", handlePoolCreated);
    
    return () => {
      window.removeEventListener("pool-created", handlePoolCreated);
    };
  }, [onSuccess]);

  // Listen for pool creation success event
  useEffect(() => {
    const handlePoolSuccess = (event: any) => {
      try {
        // Extract pool ID from the event detail
        const message = event.detail?.message || "";
        const poolIdMatch = message.match(/\/pool\/([^-]+)/);
        
        if (poolIdMatch && poolIdMatch[1]) {
          const poolId = poolIdMatch[1];
          
          // Store in session storage
          if (typeof window !== 'undefined') {
            sessionStorage.setItem("launchPoolId", poolId);
          }
          
          setPoolCreated(true);
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess(poolId);
          }
        }
      } catch (err) {
        console.error("Error handling pool success:", err);
      }
    };

    // Add event listener for custom success toast event
    document.addEventListener('successToast', handlePoolSuccess);
    
    // Check if we already have a poolId in session storage
    const checkExistingPool = () => {
      if (typeof window !== 'undefined') {
        const savedPoolId = sessionStorage.getItem("launchPoolId");
        if (savedPoolId && onSuccess && !poolCreated) {
          setPoolCreated(true);
          onSuccess(savedPoolId);
        }
      }
    };
    
    checkExistingPool();
    
    // Cleanup
    return () => {
      document.removeEventListener('successToast', handlePoolSuccess);
    };
  }, [onSuccess, poolCreated]);

  // If pool has been created, show success message
  if (poolAddress) {
    const poolName = typeof window !== 'undefined' ? sessionStorage.getItem("launchPoolName") : null;
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pool Created Successfully</CardTitle>
          <CardDescription>
            You've successfully created a liquidity pool for your token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Pool Details</h3>
              <p className="text-sm mb-1">
                <span className="font-medium">Pool ID:</span> {poolAddress}
              </p>
              {poolName && (
                <p className="text-sm">
                  <span className="font-medium">Pool Pair:</span> {poolName}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Your token now has liquidity and can be traded on the DEX.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => router.push("/launch/complete")}>
            Complete Launch
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Show pool creation form
  return (
    <Card className={cn("w-full max-w-lg mx-auto", className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack || (() => router.back())}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Create Pool</CardTitle>
        </div>
        <CardDescription className="mt-2">
          Create a new liquidity pool by selecting tokens and parameters
        </CardDescription>
        
        {savedTokenType && (
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-sm text-secondary-foreground">
              Using token: <span className="font-medium">{savedTokenType?.split('::')[2] || savedTokenType}</span>
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-2">
        <CreatePoolCard isLauncherFlow />
      </CardContent>
    </Card>
  );
} 
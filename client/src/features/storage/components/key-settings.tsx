import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";
import useLocalStorage from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Copy, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useServerPublicKey,
  useSyncKeys,
  useUserKeys,
} from "../queries/key-queries";
import { generateKey, SigningAlgorithm } from "../encryption";

export function KeySettings() {
  const [encryptionKey, setEncryptionKey] = useLocalStorage("private-key");
  const [_, setSymmetricKey] = useLocalStorage("symmetric-key");
  const [showWarning, setShowWarning] = useState(false);
  const [algorithm, setAlgorithm] = useState<SigningAlgorithm>(() => {
    try {
      if (encryptionKey) {
        const parsed = JSON.parse(encryptionKey);
        if (parsed && parsed.algorithm) {
          return parsed.algorithm;
        }
      }
    } catch (error) {
      console.error("Failed to parse encryption key for algorithm:", error);
    }
    return "RSA";
  });

  const { data: serverPublicKey, isLoading: isLoadingServerKey } =
    useServerPublicKey();
  const { data: userKeys } = useUserKeys();
  const { mutate: syncKeys, isPending: isSyncingKeys } = useSyncKeys();

  // Parse safely, ensuring keyPair is null if parsing fails or key is empty/invalid
  let keyPair = null;
  try {
    if (encryptionKey) {
      const parsed = JSON.parse(encryptionKey);
      // Basic check for expected structure
      if (parsed && parsed.privateKey && parsed.publicKey) {
        keyPair = parsed;
      } else {
        console.warn("Invalid key structure found in local storage.");
        // Optionally clear the invalid key: setEncryptionKey("");
      }
    }
  } catch (error) {
    console.error("Failed to parse encryption key from local storage:", error);
    // Optionally clear the invalid key: setEncryptionKey("");
  }

  // Determine sync status based on userKeys check *and* local key presence
  const isKeySynced = !!keyPair && (userKeys?.has_key || false);
  const hasLocalKey = !!keyPair;

  const handleCopyPublicKey = () => {
    if (keyPair?.publicKey) {
      navigator.clipboard.writeText(keyPair.publicKey);
      toast.success("Public key copied to clipboard");
    }
  };

  const handleExportFullKey = () => {
    if (keyPair?.privateKey) {
      const exportData = {
        privateKey: keyPair.privateKey,
        exportDate: new Date().toISOString(),
        version: "1.0",
      };
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `private-key-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Private key exported as JSON file");
    }
  };

  const handleGenerateKey = async () => {
    // Show warning only if a *valid* key pair already exists
    if (hasLocalKey) {
      setShowWarning(true);
      return;
    }

    // Prevent generation if server key isn't loaded yet
    if (!serverPublicKey) {
      toast.error("Server public key not available. Cannot generate keys yet.");
      return;
    }

    try {
      // Generate keys with selected algorithm, format, encrypt symmetric key
      const keys = await generateKey(serverPublicKey, algorithm);

      // Sync keys with server
      syncKeys(
        {
          encrypted_asymmetric_key: keys.encryptedKey,
          public_key: keys.publicKey,
          algorithm: keys.algorithm, // Include algorithm in the request
        },
        {
          onSuccess: () => {
            // Save the PRIVATE and PUBLIC key pair locally after successful sync
            const keyPairString = JSON.stringify({
              privateKey: keys.privateKey, // Store the generated private key
              publicKey: keys.publicKey, // Store the generated public key
              algorithm: keys.algorithm, // Store the algorithm used
            });

            setEncryptionKey(keyPairString);
            setSymmetricKey(keys.rawSymmetricKey);
            toast.success(
              `${algorithm} keys generated and synced successfully`
            );
          },
          onError: (error: any) => {
            console.error("Sync Error:", error);
            toast.error("Failed to sync keys with server. Please try again.");
          },
        }
      );
    } catch (error) {
      toast.error("Failed to generate keys. See console for details.");
      console.error("Key Generation Error:", error);
    }
  };

  const confirmKeyChange = () => {
    setShowWarning(false);
    // Clear the key *before* generating a new one
    setEncryptionKey("");
    setSymmetricKey("");
    // Immediately attempt to generate the new key
    handleGenerateKey();
  };

  // Simple truncation for display
  const truncateKey = (key: string | undefined, length = 16) => {
    if (!key) return "N/A";
    const start = key.substring(0, length);
    const end = key.substring(key.length - length);
    return `${start}...${end}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Key Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Encryption Key Management</CardTitle>
          <CardDescription>
            Generate and manage your encryption key pair. Your private key
            remains securely stored in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="key-algorithm">Signing Algorithm</Label>
            <Select
              value={algorithm}
              onValueChange={(value: SigningAlgorithm) => setAlgorithm(value)}
            >
              <SelectTrigger id="key-algorithm">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RSA">
                  RSA (larger, widely supported)
                </SelectItem>
                <SelectItem value="ECC">ECC (smaller, faster)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {algorithm === "RSA"
                ? "RSA provides strong security but produces larger signatures."
                : "ECC uses elliptic curve cryptography for smaller, faster signatures."}
            </p>
          </div>

          <Button
            onClick={handleGenerateKey}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoadingServerKey || isSyncingKeys || !serverPublicKey} // Disable if server key missing
            title={
              !serverPublicKey
                ? "Waiting for server connection..."
                : hasLocalKey
                ? "Regenerate Keys (will overwrite)"
                : "Generate New Keys"
            }
          >
            <RefreshCw className="size-4" />
            {hasLocalKey ? "Regenerate Keys" : "Generate Keys"}
          </Button>
          {isLoadingServerKey && (
            <p className="text-sm text-muted-foreground mt-2">
              Loading server data...
            </p>
          )}
          {isSyncingKeys && (
            <p className="text-sm text-muted-foreground mt-2">
              Syncing keys...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Status Section - Only show if a key exists locally */}
      {hasLocalKey && keyPair && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <h1>Your Keys</h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs rounded-sm",
                  isKeySynced
                    ? "bg-green-500/20 dark:text-green-500 text-green-600 "
                    : "bg-red-500/20 text-red-500"
                )}
              >
                <div className="flex items-center gap-1">
                  {isKeySynced ? (
                    <Check className="size-3" />
                  ) : (
                    <AlertTriangle className="size-3" />
                  )}
                  {isKeySynced ? "Synced" : "Not Synced"}
                </div>
              </Badge>
            </CardTitle>
            <CardDescription>
              Here is your public key ({keyPair.algorithm || "RSA"} algorithm).
              Your private key is stored locally in your browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PasswordInput value={keyPair.publicKey} />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleExportFullKey}>
              <Download className="size-4" /> Export Private Key
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyPublicKey}>
              <Copy className="size-4" /> Copy Public Key
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Overwrite Existing Key?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You already have an encryption key. Generating a new one will
              replace the current key. **Any data encrypted with the old key
              will be unrecoverable unless you have backed it up.** Are you sure
              you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmKeyChange}>
              Yes, Generate New Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Copy, Key } from "lucide-react";
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
import useLocalStorage from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";

export function KeySettings() {
  const [encryptionKey, setEncryptionKey] = useLocalStorage("private-key");
  const [showWarning, setShowWarning] = useState(false);
  const [pendingKey, setPendingKey] = useState("");

  const keyPair = encryptionKey ? JSON.parse(encryptionKey) : null;

  const handleCopyKey = (key: string, type: "public" | "private") => {
    navigator.clipboard.writeText(key);
    toast.success(
      `${type === "public" ? "Public" : "Private"} key copied to clipboard`
    );
  };

  const handleGenerateKey = async () => {
    try {
      // Generate RSA key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048, // You can use 2048, 3072, or 4096 bits
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"] // key usage
      );

      // Export the private key to store it securely
      const privateKeyJwk = await window.crypto.subtle.exportKey(
        "jwk",
        keyPair.privateKey
      );

      // Export the public key to share with the server
      const publicKeyJwk = await window.crypto.subtle.exportKey(
        "jwk",
        keyPair.publicKey
      );

      const keyPairString = JSON.stringify({
        privateKey: privateKeyJwk,
        publicKey: publicKeyJwk,
      });

      // If files exist, show warning before changing key
      if (encryptionKey) {
        setPendingKey(keyPairString);
        setShowWarning(true);
      } else {
        setEncryptionKey(keyPairString);
        toast.success("Key generated successfully");
      }
    } catch (error) {
      toast.error("Failed to generate RSA key pair");
      console.error(error);
    }
  };

  const handleSaveKey = () => {
    if (!encryptionKey) {
      toast.error("Please enter or generate a key first");
      return;
    }
    console.log(encryptionKey);
    localStorage.setItem("private-key", encryptionKey);
    toast.success("Key saved to your browser storage.");
  };

  const confirmKeyChange = () => {
    setEncryptionKey(pendingKey);
    setShowWarning(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Encryption Keys</h2>
        <Button
          onClick={handleGenerateKey}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="size-3" />
          Generate New Keys
        </Button>
      </div>

      {!keyPair ? (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center flex flex-col items-center gap-5 text-muted-foreground">
              <Key className="size-12 opacity-50" />
              <p className="text-sm">No keys generated yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Public Key</CardTitle>
              <CardDescription>
                Share this key with others to receive encrypted files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordInput
                className="text-xs break-all"
                value={keyPair.publicKey.n?.slice(0, 32)}
              />
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() =>
                  handleCopyKey(JSON.stringify(keyPair.publicKey), "public")
                }
              >
                <Copy className="size-3 mr-2" />
                Copy Full Key
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-sm border-warning/50">
            <CardHeader>
              <CardTitle className="text-warning">Private Key</CardTitle>
              <CardDescription>
                Keep this key secret. It's required to decrypt your files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-warning/10  rounded-lg">
                <PasswordInput
                  className="text-xs break-all"
                  value={keyPair.privateKey.d?.slice(0, 32)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-warning"
                onClick={() =>
                  handleCopyKey(JSON.stringify(keyPair.privateKey), "private")
                }
              >
                <Copy className="size-3 mr-2" />
                Copy Full Key
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="size-5 text-amber-500 mr-2" />
              Change Encryption Key?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You already have files encrypted with your current key. Generating
              a new key means you won't be able to decrypt those files unless
              you save your current key somewhere safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmKeyChange}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

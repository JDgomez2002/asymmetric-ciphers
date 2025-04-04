"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
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
import { PasswordInput } from "@/components/ui/password-input";

interface EncryptionKeySectionProps {
  encryptionKey: string;
  onKeyChange: (key: string) => void;
  onSaveKey: () => void;
  onClearKey: () => void;
  hasFiles?: boolean;
}

export function EncryptionKeySection({
  encryptionKey,
  onKeyChange,
  onSaveKey,
  onClearKey,
  hasFiles = false,
}: EncryptionKeySectionProps) {
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pendingKey, setPendingKey] = useState("");

  useEffect(() => {
    // Check if a key exists in browser storage
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("secureFileVaultKey");
      setHasStoredKey(!!savedKey);
    }
  }, [encryptionKey]);

  const handleGenerateKey = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
    let key = "";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // If files exist, show warning before changing key
    if (hasFiles && encryptionKey) {
      setPendingKey(key);
      setShowWarning(true);
    } else {
      onKeyChange(key);
    }
  };

  const confirmKeyChange = () => {
    onKeyChange(pendingKey);
    setShowWarning(false);
  };

  return (
    <>
      <Card className="shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Encryption Key</CardTitle>
          </div>
          <CardDescription>
            The encryption key is used to encrypt and decrypt your files.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-gradient-to-b from-card to-card/80">
          <div className="space-y-4">
            <PasswordInput
              value={encryptionKey}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder="Enter or generate a key"
              className="bg-background/50 border-border/30 focus-visible:ring-primary/30"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            onClick={handleGenerateKey}
            variant="outline"
            size="sm"
            className="gap-2 border-border/30 bg-background/50 hover:bg-background"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate
          </Button>
          <Button
            onClick={onSaveKey}
            size="sm"
            className=" bg-primary"
            disabled={!encryptionKey}
          >
            {hasStoredKey ? "Update" : "Save"}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
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
    </>
  );
}

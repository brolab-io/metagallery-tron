"use client";
import { useAccount, useConnectModal } from "@web3modal/react";
import { useCallback } from "react";
import Button from "./Button";

const ConnectMetamaskButton = () => {
  const { open } = useConnectModal();
  const { isReady, account } = useAccount();

  const handleConnect = useCallback(() => {
    open();
  }, [open]);

  if (!isReady) {
    return (
      <Button outlined disabled onClick={handleConnect}>
        Authenticating...
      </Button>
    );
  }

  if (!account.address) {
    return (
      <Button outlined onClick={handleConnect}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button outlined>
      {account.address.slice(0, 6)}...{account.address.slice(-4)}
    </Button>
  );
};

export default ConnectMetamaskButton;

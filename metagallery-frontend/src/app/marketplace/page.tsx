"use client";
import { providers, Contract } from "ethers";
import { useCallback } from "react";
import { toast } from "react-toastify";
import Button from "../../common/components/Button";
import Container from "../../common/components/Container";
import { getTxMessage } from "../../common/utils/tx";
import NftList from "../../features/Nft/components/NftList";

const MarketplacePage = () => {
  const createPaymmetToken = useCallback(async () => {
    const tokenAdress = process.env.NEXT_PUBLIC_CONTRACT_TOKEN_ADDRESS!;
    const marketAddress = process.env.NEXT_PUBLIC_CONTRACT_MARKETPLACE_ADDRESS!;
    const abi = ["function addPaymentToken(address) public"];
    const provider = new providers.Web3Provider(window.ethereum as any);
    const contract = new Contract(marketAddress, abi, provider.getSigner());
    try {
      await contract.addPaymentToken(tokenAdress);
    } catch (error) {
      toast.error(getTxMessage(error));
      console.log(error);
    }
  }, []);
  return (
    <Container className="py-10">
      <NftList isMarket />
      <Button className="!hidden" onClick={createPaymmetToken}>
        Add PaymentToken
      </Button>
    </Container>
  );
};

export default MarketplacePage;

import type { ConfigOptions } from "@web3modal/core";
import type { ChainProviderFn, EthereumOptions } from "@web3modal/ethereum";
import { providers } from "ethers";

const metamaskProvider: ChainProviderFn = () => {
  return {
    chain: JSON.parse(process.env.NEXT_PUBLIC_ETHERUM_CHAINS!)[0],
    provider: () => new providers.Web3Provider(window.ethereum as any),
  };
};

const ethereumOptions: EthereumOptions = {
  appName: "MetaGallery",
  chains: JSON.parse(process.env.NEXT_PUBLIC_ETHERUM_CHAINS!),
  providers: [metamaskProvider],
};

const web3Config: ConfigOptions = {
  projectId: "c0484c60a018f7fe0e6a14ca08686fcf",
  theme: "light",
  accentColor: "default",
  ethereum: ethereumOptions,
} as const;

export default web3Config;

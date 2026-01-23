import { ethers } from "ethers";
import { MARKETPLACE_ADDRESS } from "./addresses";
import marketplaceAbi from "../../constants/marketplaceAbi.json";
import { getSigner } from "../signer";

export const getMarketplaceContract = async () => {
  const signer = await getSigner();
  return new ethers.Contract(
    MARKETPLACE_ADDRESS,
    marketplaceAbi,
    signer
  );
};

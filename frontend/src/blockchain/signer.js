import { getProvider } from "./provider";

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

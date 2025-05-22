import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const Message = await ethers.getContractFactory("Message");
  const message = await Message.deploy();
  
  // Wait for deployment to finish
  await message.waitForDeployment();
  
  const messageAddress = await message.getAddress();
  console.log("Message contract deployed to:", messageAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
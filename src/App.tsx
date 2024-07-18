import UniversalProvider from "@walletconnect/universal-provider";
import { WalletConnectModal } from "@walletconnect/modal";
import { useEffect, useState } from "react";

import { TronService, TronChains } from "./utils/tronService";

const projectId = import.meta.env.VITE_PROJECT_ID;

const events: string[] = [];

// 1. select chains (tron)
const chains = [`tron:${TronChains.Mainnet}`];

// 2. select methods (tron)
const methods = ["tron_signMessage", "tron_signTransaction"];

// 3. create modal instance
const modal = new WalletConnectModal({
  projectId,
  chains,
});

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  // 4. create State for Universal Provider and tronService
  const [provider, setProvider] = useState<UniversalProvider | null>(null);
  const [tronService, setTronService] = useState<TronService | null>(null);



  // 5. initialize Universal Provider onLoad
  useEffect(() => {
    async function setOnInitProvider() {
      const providerValue = await UniversalProvider.init({
        logger: "error",
        projectId: projectId,
        metadata: {
          name: "WalletConnect x Tron",
          description: "Tron integration with WalletConnect's Universal Provider",
          url: "https://walletconnect.com/",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
      });
        
      setProvider(providerValue);
    }
    
    setOnInitProvider();
    
  }, []);

  // 6. set tronService and address on provider load
  useEffect(() => {
    if (!provider) return;
    const tronServiceValue = new TronService(provider);


    provider.on("display_uri", async (uri: string) => {
      console.log("uri", uri);
      await modal.openModal({
        uri,
      });
    });

    // get address
    setAddress(provider.session?.namespaces.tron?.accounts[0].split(":")[2]!);
    setTronService(tronServiceValue);
  }, [provider]);


  // 7. get balance when connected
  useEffect(() => {
    async function  getBalanceInit() {
      if (!tronService) return;
      const res = await tronService.getBalance(address!);

      setBalance(res!);
    }
    
    if (!isConnected) return; 
    getBalanceInit()
  }, [isConnected, tronService]);

  // 8. handle connect event
  const connect = async () => {
    try {
      await provider!.connect({
        namespaces: {
          tron: {
            methods,
            chains,
            events,
          },
        },
      });
      setIsConnected(true);
      console.log("session", provider!.session);
    } catch {
      console.log("Something went wrong, request cancelled");
    }
    modal.closeModal();
  };

  // 9. handle disconnect event
  const disconnect = async () => {
    await provider!.disconnect();
    setIsConnected(false);
  };

  // 10. handle get Balance, signMessage and sendTransaction
  const handleSign = async () => {
    console.log("signing");
    const res = await tronService!.signMessage(
      `Can i have authorize this request pls - ${Date.now()}`,
      address!
    );
    console.log("result sign: ",res);
  };

  const handleGetBalance = async () => {
    const res = await tronService!.getBalance(address!);
    console.log(res);
    setBalance(res);
  };

  const handleSendTransaction = async () => {
    console.log("signing");
    const res = await tronService!.signTransaction(address!, 100);
    console.log("result send tx: ", res);
  };

  return (
    <div className="App">
      {isConnected ? (
        <>
          <p>
            <b>Address: </b>{address}<br />
            <b>Balance: </b>{balance}<br />
          </p>
          <div className="btn-container">
          <button onClick={handleGetBalance}>get Balance</button>
            <button onClick={handleSign}>Sign MSG</button>
            <button onClick={handleSendTransaction}>Send Transaction</button>
            <button onClick={disconnect}>Disconnect</button>
          </div>
        </>
      ) : (
        <button onClick={connect}>Connect</button>
      )}
    </div>
  );
};

export default App;

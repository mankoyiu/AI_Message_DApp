import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// @ts-ignore
import abiJson from './abiMessage.json';
const abi = abiJson.abi;

// Define a type for conversation entries
type ConversationEntry = {
  timestamp: string;
  user: string;
  ai: string;
};

export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [contractMessage, setContractMessage] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512');
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    const fetchLatestMessage = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(contractAddress, abi, provider);
          const msg = await contract.currentMessage();
          console.log('Fetched message:', msg);
          setContractMessage(msg);
        } catch (error) {
          console.error('Error fetching message:', error);
        }
      } else {
        setMessage('No Ethereum wallet detected. Please install MetaMask.');
      }
    };

    fetchLatestMessage();
    fetchConversationHistory();
  }, []);
  
  // Function to fetch conversation history from the backend
  const fetchConversationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('http://localhost:10888/history');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched conversation history:', data);
      
      if (data.conversations && Array.isArray(data.conversations)) {
        setConversationHistory(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    }
  }

  async function fetchMessage(newMsg: string, contractAddress: string, abi: any) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get network info for debugging
      const network = await provider.getNetwork();
      console.log('Connected to network:', {
        chainId: network.chainId,
        name: network.name
      });
      
      // Check if we're on the right network (Hardhat's chainId is 31337)
      if (Number(network.chainId) !== 31337) {
        console.warn('Warning: Not connected to Hardhat network (chainId 31337)');
        setContractMessage('Error: Please connect to Hardhat localhost network');
        return;
      }
      
      console.log('Using contract address:', contractAddress);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      
      // Try to call the contract
      try {
        const msg = await contract.currentMessage();
        console.log('Contract returned message:', msg);
        setContractMessage(msg);
      } catch (contractError: any) {
        console.error('Contract call error:', contractError);
        
        // Check if this is a decode error
        if (contractError.code === 'BAD_DATA') {
          setContractMessage('Error: Could not decode contract data. The contract may not be deployed at this address.');
        } else {
          setContractMessage(`Error: ${contractError.message || 'Unknown contract error'}`);
        }
      }
    } catch (error: any) {
      console.error('Error in fetchMessage:', error);
      setContractMessage(`Error: ${error.message || 'Unknown error'}`);
    }
  }

  async function updateMessage(newMsg: string, contractAddress: string, abi: any) {
    try {
      console.log('Attempting to update message...');
      
      // First, complete the blockchain transaction
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log('Connected signer address:', await signer.getAddress());
      
      const contract = new ethers.Contract(contractAddress, abi, signer);
      console.log('Contract instance created');
      
      // Estimate gas before sending transaction
      try {
        const gasEstimate = await contract.setMessage.estimateGas(newMsg);
        console.log('Estimated gas:', gasEstimate.toString());
      } catch (error) {
        console.error('Gas estimation failed:', error);
        throw new Error('Failed to estimate gas. The transaction might fail.');
      }
      
      // Send the transaction and wait for confirmation
      const tx = await contract.setMessage(newMsg);
      console.log('Transaction sent:', tx.hash);
      
      // Show a message that we're waiting for confirmation
      setAiResponse('Waiting for transaction confirmation...');
      
      // Wait for the transaction to be confirmed
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      // Only after successful transaction, call the AI service
      const response = await fetch('http://localhost:10888', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ msg: newMsg }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const aiText = await response.json();
      console.log('AI response:', aiText);
      setAiResponse(aiText.ai);
      
      // Fetch updated conversation history after sending a new message
      await fetchConversationHistory();
      
      // Use fetchMessage to get the latest message from the contract
      await fetchMessage(newMsg, contractAddress, abi);
      //another way: setContractMessage(newMsg);
      
    } catch (error: any) {
      console.error('Error in updateMessage:', error);
      if (error.code === -32603) {
        alert('Transaction failed. Please check if you have enough ETH for gas and if the contract is properly deployed.');
      } else {
        alert('Error: ' + (error.message || 'Unknown error'));
      }
    }
  }

  return (
    <div style={{ 
      backgroundColor: '#000000', 
      color: '#ffffff',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#4CAF50' }}>Blockchain Message App</h2>
        <button 
          onClick={connectWallet}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#333', 
            color: 'white', 
            border: '1px solid #555', 
            borderRadius: '4px', 
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Connect Wallet
        </button>
        <p style={{ color: '#aaa' }}>Connected Account: <span style={{ color: '#fff' }}>{account}</span></p>
        <input 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Enter your message"
          style={{ 
            padding: '8px', 
            marginRight: '10px', 
            width: '300px',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        />

        <button 
          onClick={() => updateMessage(message, contractAddress, abi)}
          style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Send Message
        </button>

        <p>Current Blockchain Message: <strong style={{ color: '#4CAF50' }}>{contractMessage}</strong></p>
      </div>
      
      {aiResponse && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          border: '1px solid #444', 
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          backgroundColor: '#222',
          color: '#ddd'
        }}>
          <h3 style={{ color: '#4CAF50' }}>Latest AI Response:</h3>
          <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
        </div>
      )}
      
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: '#4CAF50' }}>Conversation History</h3>
        {isLoadingHistory ? (
          <p style={{ color: '#aaa' }}>Loading conversation history...</p>
        ) : conversationHistory.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {conversationHistory.map((entry, index) => (
              <div key={index} style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                border: '1px solid #444',
                borderRadius: '5px',
                backgroundColor: index % 2 === 0 ? '#222' : '#1a1a1a'
              }}>
                <p style={{ margin: '0 0 5px 0', color: '#888' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
                <div style={{ 
                  backgroundColor: '#333', 
                  padding: '10px', 
                  borderRadius: '5px',
                  marginBottom: '10px',
                  color: '#fff'
                }}>
                  <strong style={{ color: '#4CAF50' }}>You:</strong> {entry.user}
                </div>
                <div style={{ 
                  backgroundColor: '#2a2a2a', 
                  padding: '10px', 
                  borderRadius: '5px',
                  whiteSpace: 'pre-wrap',
                  color: '#ddd'
                }}>
                  <strong style={{ color: '#4CAF50' }}>AI:</strong> <span dangerouslySetInnerHTML={{ __html: entry.ai.replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#aaa' }}>No conversation history available.</p>
        )}
      </div>
    </div>
  );
}

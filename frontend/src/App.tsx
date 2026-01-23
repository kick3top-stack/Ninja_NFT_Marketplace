import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { MintPage } from './components/MintPage';
import { CollectionsPage } from './components/CollectionsPage';
import { CollectionDetailPage } from './components/CollectionDetailPage';
import { AuctionsPage } from './components/AuctionsPage';
import { ProfilePage } from './components/ProfilePage';
import { Navigation } from './components/Navigation';
import { PreloadEffect } from './components/PreloadEffect';
import { AlertModal } from './components/AlertModal';
import { ethers } from 'ethers';

export type NFT = {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
  collection: string;
  creator: string;
  owner: string;
  status: 'listed' | 'unlisted' | 'auction';
  highestBid?: number;
  auctionEndTime?: Date;
  minBid?: number;
  rarity?: string;
  createdAt: Date;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  floorPrice: number;
  nftCount: number;
};

export type Transaction = {
  id: string;
  type: 'sale' | 'purchase' | 'mint' | 'bid';
  nft: string;
  price: number;
  date: Date;
};

export type AppContextType = {
  wallet: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  nfts: NFT[];
  collections: Collection[];
  transactions: Transaction[];
  addNFT: (nft: NFT) => void;
  updateNFT: (id: string, updates: Partial<NFT>) => void;
  addCollection: (collection: Collection) => void;
  showAlert: (message: string, type: 'success' | 'error') => void;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Mock data
  const [nfts, setNfts] = useState<NFT[]>([
    {
      id: '1',
      name: 'Cosmic Dream #1',
      description: 'A beautiful cosmic artwork',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400',
      price: 2.5,
      collection: 'cosmic-dreams',
      creator: '0x1234...5678',
      owner: '0x1234...5678',
      status: 'listed',
      rarity: 'Rare',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Digital Horizon #42',
      description: 'Abstract digital landscape',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      price: 1.8,
      collection: 'digital-horizons',
      creator: '0xabcd...efgh',
      owner: '0xabcd...efgh',
      status: 'auction',
      highestBid: 1.2,
      minBid: 1.0,
      auctionEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      rarity: 'Common',
      createdAt: new Date('2024-01-20'),
    },
    {
      id: '3',
      name: 'Neon City #7',
      description: 'Cyberpunk cityscape',
      image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400',
      price: 3.2,
      collection: 'neon-cities',
      creator: '0x9876...5432',
      owner: '0x9876...5432',
      status: 'listed',
      rarity: 'Epic',
      createdAt: new Date('2024-01-10'),
    },
    {
      id: '4',
      name: 'Abstract Wave #15',
      description: 'Fluid abstract art',
      image: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400',
      collection: 'abstract-waves',
      creator: '0x1111...2222',
      owner: '0x1111...2222',
      status: 'unlisted',
      rarity: 'Rare',
      createdAt: new Date('2024-01-25'),
    },
    {
      id: '5',
      name: 'Galaxy Portal #3',
      description: 'Portal to another dimension',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      price: 4.5,
      collection: 'cosmic-dreams',
      creator: '0x1234...5678',
      owner: '0x3333...4444',
      status: 'listed',
      rarity: 'Legendary',
      createdAt: new Date('2024-01-12'),
    },
    {
      id: '6',
      name: 'Pixel Paradise #88',
      description: 'Retro pixel art',
      image: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400',
      collection: 'pixel-paradise',
      creator: '0x5555...6666',
      owner: '0x5555...6666',
      status: 'auction',
      highestBid: 2.8,
      minBid: 2.5,
      auctionEndTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      rarity: 'Epic',
      createdAt: new Date('2024-01-18'),
    },
  ]);

  const [collections, setCollections] = useState<Collection[]>([
    {
      id: 'cosmic-dreams',
      name: 'Cosmic Dreams',
      description: 'A collection of cosmic and space-themed artworks',
      image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400',
      creator: '0x1234...5678',
      floorPrice: 2.5,
      nftCount: 2,
    },
    {
      id: 'digital-horizons',
      name: 'Digital Horizons',
      description: 'Abstract digital landscapes and horizons',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      creator: '0xabcd...efgh',
      floorPrice: 1.8,
      nftCount: 1,
    },
    {
      id: 'neon-cities',
      name: 'Neon Cities',
      description: 'Cyberpunk cityscapes with neon lights',
      image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400',
      creator: '0x9876...5432',
      floorPrice: 3.2,
      nftCount: 1,
    },
    {
      id: 'abstract-waves',
      name: 'Abstract Waves',
      description: 'Fluid and dynamic abstract artworks',
      image: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=400',
      creator: '0x1111...2222',
      floorPrice: 0,
      nftCount: 1,
    },
    {
      id: 'pixel-paradise',
      name: 'Pixel Paradise',
      description: 'Retro-inspired pixel art collection',
      image: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400',
      creator: '0x5555...6666',
      floorPrice: 2.8,
      nftCount: 1,
    },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'purchase',
      nft: 'Galaxy Portal #3',
      price: 4.5,
      date: new Date('2024-01-22'),
    },
    {
      id: '2',
      type: 'mint',
      nft: 'Cosmic Dream #1',
      price: 0.01,
      date: new Date('2024-01-15'),
    },
  ]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not detected. Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      setWallet(accounts[0]);
      showAlert('Wallet connected', 'success');
    } catch (err) {
      console.error('Wallet connection rejected', err);
      showAlert('Error connecting to wallet.', 'error');
    }
  };

  const disconnectWallet = () => {
    setWallet(null);

  // Optional: clear cached permissions (MetaMask-supported)
    if (window.ethereum?.request) {
      window.ethereum.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      }).catch(() => {
        // silently ignore
      });
    }
    showAlert('Wallet disconnected', 'success');
  };

  const addNFT = (nft: NFT) => {
    setNfts([...nfts, nft]);
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'mint',
      nft: nft.name,
      price: 0.01,
      date: new Date(),
    };
    setTransactions([...transactions, transaction]);
  };

  const updateNFT = (id: string, updates: Partial<NFT>) => {
    setNfts(nfts.map(nft => nft.id === id ? { ...nft, ...updates } : nft));
  };

  const addCollection = (collection: Collection) => {
    setCollections([...collections, collection]);
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const navigateTo = (page: string, collectionId?: string) => {
    setCurrentPage(page);
    if (collectionId) {
      setSelectedCollectionId(collectionId);
    }
  };

  const appContext: AppContextType = {
    wallet,
    connectWallet,
    disconnectWallet,
    nfts,
    collections,
    transactions,
    addNFT,
    updateNFT,
    addCollection,
    showAlert,
  };

  if (loading) {
    return <PreloadEffect />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Navigation 
        currentPage={currentPage} 
        onNavigate={navigateTo}
        context={appContext}
      />
      
      {currentPage === 'home' && <Home context={appContext} onNavigate={navigateTo} />}
      {currentPage === 'mint' && <MintPage context={appContext} />}
      {currentPage === 'collections' && <CollectionsPage context={appContext} onNavigate={navigateTo} />}
      {currentPage === 'collection-detail' && selectedCollectionId && (
        <CollectionDetailPage 
          collectionId={selectedCollectionId} 
          context={appContext}
        />
      )}
      {currentPage === 'auctions' && <AuctionsPage context={appContext} />}
      {currentPage === 'profile' && <ProfilePage context={appContext} />}

      {showAlertModal && (
        <AlertModal
          message={alertMessage}
          type={alertType}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </div>
  );
}

export default App;

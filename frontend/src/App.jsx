import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Grid from './components/Grid';
import Sidebar from './components/Sidebar';

const savedUserId = localStorage.getItem('shared_grid_userId') || Math.random().toString(36).substring(2, 15);
localStorage.setItem('shared_grid_userId', savedUserId);

const socket = io('https://assign-1-one.vercel.app/_/backend', {
  auth: { userId: savedUserId }
});

function App() {
  const [gridSize, setGridSize] = useState(30);
  const [blocks, setBlocks] = useState([]);
  const [users, setUsers] = useState({});
  const [me, setMe] = useState(null);
  const [connected, setConnected] = useState(false);
  const [resetPrompt, setResetPrompt] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('init', (data) => {
      setGridSize(data.gridSize);
      setBlocks(data.blocks);
      setUsers(data.users);
      setMe(data.me);
    });

    socket.on('users_updated', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on('user_joined', (user) => {
      setUsers((prev) => ({ ...prev, [user.id]: user }));
    });

    socket.on('user_left', (userId) => {
      setUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on('block_captured', (data) => {
      setBlocks((prev) => {
        const next = [...prev];
        next[data.blockIndex] = data.block;
        return next;
      });
      setUsers(data.users);
    });

    socket.on('grid_reset', (data) => {
      setBlocks(data.blocks);
      setUsers(data.users);
      setResetPrompt(null);
    });

    socket.on('reset_requested', (data) => {
      setResetPrompt(data);
    });

    socket.on('reset_vote_failed', () => {
      setResetPrompt(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('init');
      socket.off('users_updated');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('block_captured');
      socket.off('grid_reset');
      socket.off('reset_requested');
      socket.off('reset_vote_failed');
    };
  }, []);

  const handleBlockClick = (index) => {
    if (!connected) return;
    socket.emit('capture_block', index);
  };

  const handleResetGrid = () => {
    if (!connected) return;
    socket.emit('request_reset');
  };

  const handleVote = (vote) => {
    socket.emit('vote_reset', vote);
    setResetPrompt((prev) => ({ ...prev, voted: true }));
  };

  if (!connected || !me) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold animate-pulse text-slate-400">
          Connecting to grid...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-zinc-950 text-zinc-50 relative selection:bg-zinc-800 selection:text-zinc-100">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">

        {/* Modern Minimalist Header */}
        <header className="flex-none h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
              Grid<span className="text-zinc-500">Share</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleResetGrid}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              Reset
            </button>
            <div
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-medium flex items-center gap-2 border border-zinc-800 bg-zinc-900/30 shadow-sm text-sm"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: me.color }}></div>
              <span className="hidden sm:inline text-zinc-300">{me.name}</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 -mr-2 rounded-md hover:bg-zinc-800 text-zinc-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {resetPrompt && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-800 shadow-xl p-4 sm:p-5 rounded-lg flex flex-col items-center gap-4 w-[90%] max-w-sm animate-in slide-in-from-top-4 fade-in duration-200">
            <span className="text-zinc-300 text-sm text-center">
              <strong className="text-zinc-100 font-medium">{resetPrompt.initiator}</strong> requested a grid reset. ({resetPrompt.timeout}s)
            </span>
            {resetPrompt.initiator === me?.name || resetPrompt.voted ? (
              <span className="text-zinc-500 font-medium animate-pulse text-xs uppercase tracking-wider">Waiting for votes...</span>
            ) : (
              <div className="flex gap-3 w-full">
                <button onClick={() => handleVote(true)} className="flex-1 bg-zinc-100 hover:bg-white text-zinc-900 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">Yes</button>
                <button onClick={() => handleVote(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">No</button>
              </div>
            )}
          </div>
        )}

        {/* Grid Container */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4 sm:p-8 bg-zinc-950/50">
          <Grid
            size={gridSize}
            blocks={blocks}
            onBlockClick={handleBlockClick}
          />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-40 w-72 sm:w-80 bg-zinc-950 border-l border-zinc-800/50
          transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <Sidebar users={users} me={me} blocks={blocks} onClose={() => setIsSidebarOpen(false)} />
      </aside>
    </div>
  );
}

export default App;

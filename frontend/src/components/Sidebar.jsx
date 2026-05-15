function Sidebar({ users, me, blocks, onClose }) {
  const userList = Object.values(users).sort((a, b) => b.score - a.score);
  
  const totalBlocks = blocks.length;
  const capturedBlocks = blocks.filter(b => b !== null).length;
  const progress = (capturedBlocks / totalBlocks) * 100;

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Live Stats
        </h2>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded hover:bg-zinc-800 text-zinc-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-zinc-400 mb-2">
          <span>Grid Captured</span>
          <span className="text-zinc-300">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-zinc-900 border border-zinc-800 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-zinc-100 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2 text-right">
          {capturedBlocks} / {totalBlocks} blocks
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Leaderboard</h3>
        <div className="space-y-2">
          {userList.map((user, idx) => (
            <div 
              key={user.id}
              className={`
                flex items-center justify-between p-3 rounded-md border text-sm transition-colors
                ${user.id === me?.id ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/30 border-zinc-800/50'}
                ${user.online === false ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="font-semibold text-zinc-500 w-4 text-center">{idx + 1}</div>
                <div 
                  className="w-2.5 h-2.5 rounded-full shadow-sm" 
                  style={{ backgroundColor: user.color, boxShadow: `0 0 8px ${user.color}` }}
                />
                <span className={`font-medium ${user.id === me?.id ? 'text-zinc-100' : 'text-zinc-300'}`}>
                  {user.name} {user.id === me?.id && <span className="text-zinc-500 ml-1 font-normal">(You)</span>}
                </span>
              </div>
              <span className="font-mono font-medium text-zinc-200">
                {user.score}
              </span>
            </div>
          ))}
          {userList.length === 0 && (
            <div className="text-zinc-500 text-sm text-center py-4">No users online</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

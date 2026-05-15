import { memo } from 'react';

const Block = memo(({ index, block, onClick }) => {
  const isCaptured = !!block;

  return (
    <div
      onClick={() => onClick(index)}
      className={`
        w-10 h-10
        cursor-pointer transition-all duration-200 ease-out
        hover:scale-105 hover:z-10 hover:shadow-md
        ${!isCaptured ? 'bg-zinc-800 hover:bg-zinc-700' : ''}
      `}
      style={{
        backgroundColor: isCaptured ? block.color : undefined,
        boxShadow: isCaptured ? `0 0 12px ${block.color}40` : undefined,
        borderRadius: isCaptured ? '8px' : '4px',
      }}
      title={isCaptured ? `Captured at ${new Date(block.timestamp).toLocaleTimeString()}` : 'Unclaimed'}
    />
  );
});

Block.displayName = 'Block';

export default Block;

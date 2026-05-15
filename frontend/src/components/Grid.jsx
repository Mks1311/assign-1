import Block from './Block';

function Grid({ size, blocks, onBlockClick }) {
  return (
    <div
      className="grid gap-2 sm:gap-3 p-4 sm:p-6 bg-zinc-900/40 rounded-xl shadow-2xl border border-zinc-800 backdrop-blur-sm"
      style={{
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        width: 'fit-content'
      }}
    >
      {blocks.map((block, index) => (
        <Block
          key={index}
          index={index}
          block={block}
          onClick={onBlockClick}
        />
      ))}
    </div>
  );
}

export default Grid;

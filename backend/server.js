const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;
const GRID_SIZE = 10; // 30x30 grid
const TOTAL_BLOCKS = GRID_SIZE * GRID_SIZE;

// In-memory state
const blocks = new Array(TOTAL_BLOCKS).fill(null);
const users = {};

let resetVoteActive = false;
let resetVotes = new Set();
let voteTimeout = null;

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#f43f5e'
];

const ADJECTIVES = ['Quick', 'Sneaky', 'Brave', 'Clever', 'Wild', 'Silent', 'Mighty', 'Fierce'];
const NOUNS = ['Rat', 'Fox', 'Bear', 'Wolf', 'Hawk', 'Lion', 'Tiger', 'Owl'];

function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun} ${Math.floor(Math.random() * 100)}`;
}

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) return;

  socket.userId = userId;

  if (!users[userId]) {
    users[userId] = {
      id: userId,
      name: generateRandomName(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      score: 0,
      lastClick: 0,
      online: true
    };
  } else {
    users[userId].online = true;
  }

  socket.emit('init', {
    gridSize: GRID_SIZE,
    blocks,
    users,
    me: users[userId]
  });

  io.emit('user_joined', users[userId]);
  io.emit('users_updated', users);

  if (resetVoteActive) {
    socket.emit('reset_requested', { initiator: 'Someone', timeout: 10 });
  }

  socket.on('capture_block', (blockIndex) => {
    const user = users[socket.userId];
    if (!user) return;

    const now = Date.now();
    if (now - user.lastClick < 500) return; // 500ms cooldown
    if (blockIndex < 0 || blockIndex >= TOTAL_BLOCKS) return;

    const oldBlock = blocks[blockIndex];
    if (oldBlock && oldBlock.userId === socket.userId) return;

    blocks[blockIndex] = {
      userId: socket.userId,
      color: user.color,
      timestamp: now
    };
    user.lastClick = now;

    let newScore = 0;
    for (let b of blocks) {
      if (b && b.userId === socket.userId) newScore++;
    }
    user.score = newScore;

    if (oldBlock && oldBlock.userId && users[oldBlock.userId]) {
      let oldUserScore = 0;
      for (let b of blocks) {
        if (b && b.userId === oldBlock.userId) oldUserScore++;
      }
      users[oldBlock.userId].score = oldUserScore;
    }

    io.emit('block_captured', {
      blockIndex,
      block: blocks[blockIndex],
      users
    });
  });

  socket.on('request_reset', () => {
    if (resetVoteActive) return;

    resetVoteActive = true;
    resetVotes.clear();
    resetVotes.add(socket.userId);

    const initiatorName = users[socket.userId]?.name || 'Someone';
    io.emit('reset_requested', { initiator: initiatorName, timeout: 10 });

    clearTimeout(voteTimeout);
    voteTimeout = setTimeout(() => {
      if (resetVoteActive) {
        resetVoteActive = false;
        resetVotes.clear();
        io.emit('reset_vote_failed');
      }
    }, 10000);

    checkResetVote();
  });

  socket.on('vote_reset', (vote) => {
    if (!resetVoteActive) return;
    if (vote) {
      resetVotes.add(socket.userId);
    }
    checkResetVote();
  });

  function checkResetVote() {
    const onlineUsers = Object.values(users).filter(u => u.online);
    const totalOnline = onlineUsers.length;

    if (resetVotes.size > totalOnline / 2) {
      blocks.fill(null);
      for (const u in users) {
        users[u].score = 0;
      }
      io.emit('grid_reset', { blocks, users });
      resetVoteActive = false;
      resetVotes.clear();
      clearTimeout(voteTimeout);
    }
  }

  socket.on('disconnect', () => {
    if (users[socket.userId]) {
      users[socket.userId].online = false;
    }
    io.emit('users_updated', users);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use('/api', (req, res) => {
  res.send('Hello World!');
});

import { createContext, useReducer, useContext } from 'react';

const UPDATE_CARDS = [
  { id: 1, title: 'Protocol Upgrade', optionA: { title: 'Implement Upgrade', effect: 'MINT_BONUS' }, optionB: { title: 'Delay Upgrade', effect: 'NONE' } },
  { id: 2, title: 'Network Congestion', optionA: { title: 'Increase Block Size', effect: 'SECURE_PENALTY' }, optionB: { title: 'Keep Block Size', effect: 'NONE' } },
  { id: 3, title: 'Minority Fork', optionA: { title: 'Support Fork', effect: 'FORK_BONUS' }, optionB: { title: 'Suppress Fork', effect: 'MINORITY_PENALTY' } },
  { id: 4, title: 'Security Audit', optionA: { title: 'Fund Audit (-10 Treasury)', effect: 'SECURE_BOOST' }, optionB: { title: 'Ignore Audit', effect: 'SECURE_PENALTY' } },
  { id: 5, title: 'Validator Rewards', optionA: { title: 'Double Rewards', effect: 'VALIDATOR_BONUS' }, optionB: { title: 'Halve Rewards', effect: 'VALIDATOR_PENALTY' } },
  { id: 6, title: 'Whale Dumping', optionA: { title: 'Freeze Whale Assets', effect: 'WHALE_PENALTY' }, optionB: { title: 'Let Market Decide', effect: 'NONE' } },
  { id: 7, title: 'Miner Subsidy', optionA: { title: 'Subsidize Miners', effect: 'MINER_BONUS' }, optionB: { title: 'End Subsidy', effect: 'NONE' } },
  { id: 8, title: 'Treasury Burn', optionA: { title: 'Burn 50% Treasury', effect: 'BURN_DEF', desc: 'Increases value' }, optionB: { title: 'Keep Treasury', effect: 'NONE' } },
  { id: 9, title: 'Governance Token Airdrop', optionA: { title: 'Airdrop to All', effect: 'AIRDROP' }, optionB: { title: 'Airdrop to Devs only', effect: 'DEV_BONUS' } },
  { id: 10, title: 'Layer 2 Solution', optionA: { title: 'Adopt L2', effect: 'MINT_BONUS' }, optionB: { title: 'Stay on L1', effect: 'NONE' } },
];

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const initialState = {
  round: 1,
  securityLevel: 5, // Start at 5 so 51% attack requires 5 TK
  treasury: 100, // The Faucet/Treasury balance
  players: [
    { id: 1, name: 'Miner 1', role: 'miner', balance: 20, history: [] },
    { id: 2, name: 'Miner 2', role: 'miner', balance: 20, history: [] },
    { id: 3, name: 'Whale', role: 'whale', balance: 60, history: [] },
    { id: 4, name: 'Developer', role: 'developer', balance: 15, history: [] },
    { id: 5, name: 'Validator 1', role: 'validator', balance: 25, history: [] },
    { id: 6, name: 'Validator 2', role: 'validator', balance: 25, history: [] },
  ],
  currentTurnPlayerIndex: 0,
  phase: 'START_ROUND', // START_ROUND -> TURN -> PUZZLE_RACE -> 51_ATTACK -> END_ROUND -> UPDATE_VOTE -> NEXT_ROUND
  pendingAction: null, // For storing actions that need verification/voting
  deck: shuffle(UPDATE_CARDS),
  drawnCards: [],
  winner: null,
  logs: ['Game initialized. Welcome to FORK.'],
};

function gameReducer(state, action) {
  const log = (msg) => `${msg}`;
  const addLog = (msg) => [log(msg), ...state.logs].slice(0, 50);

  const clonePlayers = () => state.players.map(p => ({ ...p }));

  const nextTurn = (newState) => {
    let nextIndex = newState.currentTurnPlayerIndex + 1;
    if (nextIndex >= 6) {
      newState.phase = 'END_ROUND';
      // Draw 2 cards for Developer
      let cards = newState.deck.splice(0, 2);
      if (cards.length < 2) cards = [...cards, ...shuffle(UPDATE_CARDS).splice(0, 2 - cards.length)];
      newState.drawnCards = cards;
      newState.logs = addLog('Round ' + newState.round + ' turn phase ended. Developer draws Update Cards.');
      return newState;
    }
    newState.currentTurnPlayerIndex = nextIndex;
    return newState;
  };

  switch (action.type) {
    case 'START_ROUND_PAYOUTS': {
      // Validators receive 2 TK from treasury
      let players = clonePlayers();
      let treasury = state.treasury;
      players.forEach(p => {
        if (p.role === 'validator' && treasury >= 2) {
          p.balance += 2;
          p.history = [{ amount: 2, reason: 'POS Reward' }, ...p.history].slice(0, 10);
          treasury -= 2;
        }
      });
      return { 
        ...state, 
        players, 
        treasury, 
        phase: 'TURN', 
        logs: addLog(`Validators received their 2 TK POS reward.`) 
      };
    }
    
    case 'ACTION_WORK_MINT': {
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      if (state.treasury >= 1) {
        players[pIdx].balance += 1;
        players[pIdx].history = [{ amount: 1, reason: 'Work (Mint)' }, ...players[pIdx].history].slice(0, 10);
        state.treasury -= 1;
        return nextTurn({ ...state, players, treasury: state.treasury, logs: addLog(`${players[pIdx].name} worked and minted 1 TK.`) });
      }
      return state;
    }

    case 'ACTION_SECURE': {
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      if (players[pIdx].balance >= 2) {
        players[pIdx].balance -= 2;
        players[pIdx].history = [{ amount: -2, reason: 'Secure Network' }, ...players[pIdx].history].slice(0, 10);
        state.treasury += 2;
        state.securityLevel += 1;
        return nextTurn({ ...state, players, securityLevel: state.securityLevel, logs: addLog(`${players[pIdx].name} secured the network. Security is now ${state.securityLevel}.`) });
      }
      return state;
    }

    case 'ACTION_TRANSACT_INIT': {
      // Init a puzzle race because of transact. Fee is 2 TK + amount.
      let { targetPlayerId, amount } = action.payload;
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      
      const isWhaleAsynchronous = pIdx !== state.currentTurnPlayerIndex && players.find(p => p.role === 'whale' && p.id === action.payload.senderId);
      const senderIdx = action.payload.senderId ? state.players.findIndex(p => p.id === action.payload.senderId) : pIdx;

      let totalCost = amount + 2; // amount + 2 TK gas fee
      if (players[senderIdx].balance >= totalCost) {
        players[senderIdx].balance -= totalCost;
        players[senderIdx].history = [{ amount: -totalCost, reason: `Sent TK to P${targetPlayerId}` }, ...players[senderIdx].history].slice(0, 10);
        // The 2 TK gas goes to pending action for the puzzle race
        return {
          ...state,
          players,
          phase: 'PUZZLE_RACE',
          pendingAction: { type: 'TRANSACT', amount, targetPlayerId, senderIdx },
          logs: addLog(`${players[senderIdx].name} initiated a transaction of ${amount} TK. Puzzle Race started!`)
        };
      }
      return state;
    }

    case 'RESOLVE_PUZZLE_RACE': {
      // Miner who won gets the 2 TK fee.
      let { winnerMinerId } = action.payload;
      let players = clonePlayers();
      let winnerIdx = players.findIndex(p => p.id === winnerMinerId);
      players[winnerIdx].balance += 2;
      players[winnerIdx].history = [{ amount: 2, reason: 'Transaction Fee' }, ...players[winnerIdx].history].slice(0, 10);

      let targetIdx = players.findIndex(p => p.id === state.pendingAction.targetPlayerId);
      players[targetIdx].balance += state.pendingAction.amount;
      players[targetIdx].history = [{ amount: state.pendingAction.amount, reason: `Received TK` }, ...players[targetIdx].history].slice(0, 10);

      let nextState = { ...state, players, phase: 'TURN', pendingAction: null, logs: addLog(`${players[winnerIdx].name} won the Puzzle Race! Transaction completed.`) };
      
      // If it was the current turn player dictating, go next turn. If async Whale, don't advance turn.
      if (state.pendingAction.senderIdx === state.currentTurnPlayerIndex) {
        return nextTurn(nextState);
      }
      return nextState; // Whale async transact
    }

    case 'ACTION_CORRUPT_INIT': {
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      let cost = state.securityLevel;
      if (players[pIdx].balance >= cost) {
        players[pIdx].balance -= cost;
        players[pIdx].history = [{ amount: -cost, reason: '51% Attack Cost' }, ...players[pIdx].history].slice(0, 10);
        // start vote
        return {
          ...state,
          players,
          phase: '51_ATTACK_VOTE',
          pendingAction: { attackerIdx: pIdx, cost, votes: {} }, // votes: { [playerId]: 'YES' | 'NO' }
          logs: addLog(`${players[pIdx].name} initiated a 51% Attack! Network security is breached, voting required.`)
        };
      }
      return state;
    }

    case 'SUBMIT_ATTACK_VOTE': {
      let { voterId, vote } = action.payload;
      let pendingAction = { ...state.pendingAction, votes: { ...state.pendingAction.votes, [voterId]: vote } };
      
      let nextState = { ...state, pendingAction };
      
      // Check if all 5 others have voted
      if (Object.keys(pendingAction.votes).length >= 5) {
        let yesVotes = Object.values(pendingAction.votes).filter(v => v === 'YES').length;
        let noVotes = Object.values(pendingAction.votes).filter(v => v === 'NO').length;
        let players = clonePlayers();
        let logs;
        let treasury = state.treasury;

        if (yesVotes > noVotes) { // Success
          // NO voters pay 5 TK
          let penaltySum = 0;
          players.forEach(p => {
             if (pendingAction.votes[p.id] === 'NO') {
                let paid = Math.min(p.balance, 5);
                p.balance -= paid;
                p.history = [{ amount: -paid, reason: 'Attack Penalty' }, ...p.history].slice(0, 10);
                penaltySum += paid;
             }
          });
          // Distributed to Attacker + YES voters
          let receivers = [players[pendingAction.attackerIdx], ...players.filter(p => pendingAction.votes[p.id] === 'YES')];
          let split = Math.floor(penaltySum / receivers.length);
          receivers.forEach(r => {
             r.balance += split;
             if (split > 0) r.history = [{ amount: split, reason: 'Attack Loot' }, ...r.history].slice(0, 10);
          });
          logs = addLog(`51% Attack SUCCESS. NO-voters penalized.`);
        } else { // Failure
          // Attacker + YES voters forfeit investment to treasury. Wait, attacker already paid `cost`. YES voters didn't invest upfront, rule says "Attacker and all YES-voters forfeit their entire investment". 
          // Let's assume YES voters also lose something or just attacker loses investment. Rule: "Attacker and YES voters forfeit investment". Since only attacker invested, YES voters forfeit nothing unless they also pooled. We'll just take the attacker's cost to treasury.
          treasury += pendingAction.cost;
          // NO voters split 10 TK reward from treasury
          let noVoters = players.filter(p => pendingAction.votes[p.id] === 'NO');
          if (treasury >= 10 && noVoters.length > 0) {
            treasury -= 10;
            let split = Math.floor(10 / noVoters.length);
            noVoters.forEach(nv => {
               nv.balance += split;
               if (split > 0) nv.history = [{ amount: split, reason: 'Defense Reward' }, ...nv.history].slice(0, 10);
            });
          }
          logs = addLog(`51% Attack FAILED. Network defended. YES-voters and Attacker punished.`);
        }
        
        return nextTurn({ ...state, players, treasury, phase: 'TURN', pendingAction: null, logs });
      }
      
      return nextState;
    }

    case 'ACTION_ROLE_SWITCH': {
       let { targetPlayerId } = action.payload;
       let players = clonePlayers();
       let pIdx = state.currentTurnPlayerIndex;
       let targetIdx = players.findIndex(p => p.id === targetPlayerId);
       
       // Swap roles and names, keep balances? Rules say "propose a role swap", for simplicity they just swap immediately in this digital version.
       let tempRole = players[pIdx].role;
       let tempName = players[pIdx].name;
       players[pIdx].role = players[targetIdx].role;
       players[pIdx].name = players[targetIdx].name.replace(' (Swapped)', '') + ' (Swapped)';
       players[targetIdx].role = tempRole;
       players[targetIdx].name = tempName.replace(' (Swapped)', '') + ' (Swapped)';

       return nextTurn({ ...state, players, logs: addLog(`Roles swapped between Player ${pIdx+1} and Player ${targetIdx+1}.`) });
    }

    case 'DEVELOPER_CHOOSE_UPDATE': {
       let { chosenCard } = action.payload; // Passed from UI
       return { 
         ...state, 
         phase: 'UPDATE_VOTE', 
         pendingAction: { optionA: chosenCard.optionA, optionB: chosenCard.optionB, title: chosenCard.title, votes: {} }, 
         logs: addLog(`Developer proposed: ${chosenCard.title}. Network is voting.`) 
       };
    }

    case 'SUBMIT_UPDATE_VOTE': {
       let { voterId, vote } = action.payload; // vote is 'A' or 'B'
       let pendingAction = { ...state.pendingAction, votes: { ...state.pendingAction.votes, [voterId]: vote } };
       
       let nextState = { ...state, pendingAction };

       if (Object.keys(pendingAction.votes).length >= 6) {
          let aVotes = Object.values(pendingAction.votes).filter(v => v === 'A').length;
          let bVotes = Object.values(pendingAction.votes).filter(v => v === 'B').length;
          let outcome = aVotes >= bVotes ? pendingAction.optionA : pendingAction.optionB; // Ties go to A for simplicity
          
          let players = clonePlayers();
          let logs = addLog(`Blockchain Update Resolved: ${outcome.title}.`);

          // Apply outcome effects (Optional/Simplified)
          if (outcome.effect === 'MINT_BONUS') {
            players.forEach(p => {
               p.balance += 2;
               p.history = [{ amount: 2, reason: 'Update Bonus' }, ...p.history].slice(0, 10);
            });
            logs = addLog(`Update Effect: MINT_BONUS. All players received 2 TK.`);
          } else if (outcome.effect === 'SECURE_PENALTY') {
             state.securityLevel = Math.max(1, state.securityLevel - 2);
             logs = addLog(`Update Effect: SECURE_PENALTY. Security dropped by 2.`);
          } // ... other effects can be implemented here

          if (state.round >= 10) {
             let winner = players.reduce((prev, current) => (prev.balance > current.balance) ? prev : current);
             return { ...state, players, phase: 'GAME_OVER', winner, logs: addLog(`GAME OVER! ${winner.name} wins with ${winner.balance} TK!`) };
          } else {
             return { ...state, players, phase: 'START_ROUND', pendingAction: null, round: state.round + 1, currentTurnPlayerIndex: 0, logs };
          }
       }
       return nextState;
    }

    case 'RESET_GAME':
      return initialState;

    default:
      return state;
  }
}

const GameStateContext = createContext();

export function GameStateProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  return useContext(GameStateContext);
}

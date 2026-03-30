import { createContext, useReducer, useContext } from 'react';

const UPDATE_CARDS = [
  { id: 1, title: 'EIP 001 | Governance', optionA: { title: 'Code is Law: Keep Protocol Slashing. Everyone gains 2 TK for security.', effect: 'EIP_001_A' }, optionB: { title: 'Social Consensus: Activate Governance Era. Enable Free Role Switching.', effect: 'EIP_001_B' } },
  { id: 2, title: 'The Halving', optionA: { title: 'Deflation: Rewards from "Work" actions are cut to 0.5 TK (round down).', effect: 'HALVING_A' }, optionB: { title: 'Inflation: "Work" stays the same, but Gas Fees increase to 4 TK.', effect: 'HALVING_B' } },
  { id: 3, title: 'Genesis Airdrop', optionA: { title: 'Equal Distribution: Every player receives 5 TK from the bank.', effect: 'AIRDROP_A' }, optionB: { title: 'Targeted Growth: Only the two players with the fewest tokens get 10 TK.', effect: 'AIRDROP_B' } },
  { id: 4, title: 'Flash Hack', optionA: { title: 'Self-Insurance: Every player pays 3 TK to the bank to "patch the bug."', effect: 'HACK_A' }, optionB: { title: 'The Sacrifice: One random player (roll a die) loses 15 TK.', effect: 'HACK_B' } },
  { id: 5, title: 'Proof of Stake', optionA: { title: 'Keep PoW: Miners continue solving puzzles for fees.', effect: 'POS_A' }, optionB: { title: 'Transition to PoS: Miners lose their puzzle ability; the player with the most TK collects fees.', effect: 'POS_B' } },
  { id: 6, title: 'The Big Burn', optionA: { title: 'Token Burn: The bank destroys half its tokens. "Work" actions are disabled for 1 round.', effect: 'BURN_A' }, optionB: { title: 'Liquidity Injection: The bank doubles its tokens. "Work" rewards are doubled for 1 round.', effect: 'BURN_B' } },
  { id: 7, title: 'Layer 2 Scaling', optionA: { title: 'Fast Track: Gas fees are reduced to 0 TK for the next 5 transactions.', effect: 'L2_A' }, optionB: { title: 'Security First: Keep fees at 2 TK, but "Secure" actions are now free.', effect: 'L2_B' } },
  { id: 8, title: 'Dark Pool Trade', optionA: { title: 'Privacy: Transactions are now hidden. The Whale can send tokens without others knowing the amount.', effect: 'DARK_A' }, optionB: { title: 'Transparency: All transactions must be announced loudly. If you forget, you lose 5 TK.', effect: 'DARK_B' } },
  { id: 9, title: 'The Hard Fork', optionA: { title: 'Chain A: Stay on the original rules. Miners gain 5 TK.', effect: 'FORK_A' }, optionB: { title: 'Chain B: Move to new rules. Validators gain 5 TK. Minority side loses 5 TK.', effect: 'FORK_B' } },
  { id: 10, title: 'Oracle Failure', optionA: { title: 'Trust the Math: Reset the "Network Security" level to 0. Corruption is now cheaper.', effect: 'ORACLE_A' }, optionB: { title: 'Trust the People: Increase "Network Security" by 10. Corruption is now very expensive.', effect: 'ORACLE_B' } },
];

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

export const defaultSettings = {
  maxRounds: 10,
  mintReward: 1,
  secureCost: 2,
  secureGain: 1,
  gasFee: 2,
  treasuryStart: 100,
  posReward: 2,
  defenseRewardPool: 10,
  roles: {
    miner: { startingTokens: 20, voteWeight: 1, attackSuccessPenalty: 5, attackFailPenalty: 0 },
    whale: { startingTokens: 60, voteWeight: 1, attackSuccessPenalty: 5, attackFailPenalty: 0 },
    developer: { startingTokens: 15, voteWeight: 1, attackSuccessPenalty: 5, attackFailPenalty: 0 },
    validator: { startingTokens: 25, voteWeight: 1, attackSuccessPenalty: 5, attackFailPenalty: 0 },
  }
};

export const createInitialState = (settings = defaultSettings) => ({
  round: 1,
  securityLevel: 5,
  treasury: settings.treasuryStart,
  settings,
  players: [
    { id: 1, name: 'Miner 1', role: 'miner', balance: settings.roles.miner.startingTokens, history: [] },
    { id: 2, name: 'Miner 2', role: 'miner', balance: settings.roles.miner.startingTokens, history: [] },
    { id: 3, name: 'Whale', role: 'whale', balance: settings.roles.whale.startingTokens, history: [] },
    { id: 4, name: 'Developer', role: 'developer', balance: settings.roles.developer.startingTokens, history: [] },
    { id: 5, name: 'Validator 1', role: 'validator', balance: settings.roles.validator.startingTokens, history: [] },
    { id: 6, name: 'Validator 2', role: 'validator', balance: settings.roles.validator.startingTokens, history: [] },
  ],
  currentTurnPlayerIndex: 0,
  phase: 'START_ROUND', // START_ROUND -> TURN -> PUZZLE_RACE -> 51_ATTACK -> END_ROUND -> UPDATE_VOTE -> NEXT_ROUND
  pendingAction: null, // For storing actions that need verification/voting
  deck: shuffle(UPDATE_CARDS),
  drawnCards: [],
  winner: null,
  logs: ['Game initialized. Welcome to FORK.'],
});

const initialState = createInitialState();

export function gameReducer(state, action) {
  const log = (msg) => `${msg}`;
  const addLog = (msg) => [log(msg), ...state.logs].slice(0, 50);

  const clonePlayers = () => state.players.map(p => ({ ...p }));

  const nextTurn = (newState) => {
    let nextIndex = newState.currentTurnPlayerIndex + 1;
    if (nextIndex >= 6) {
      newState.phase = 'END_ROUND';
      let cards = newState.deck.splice(0, 1);
      if (cards.length < 1) cards = [...cards, ...shuffle(UPDATE_CARDS).splice(0, 1 - cards.length)];
      newState.drawnCards = cards;
      newState.logs = addLog('Round ' + newState.round + ' turn phase ended. Developer draws an Update Card.');
      return newState;
    }
    newState.currentTurnPlayerIndex = nextIndex;
    return newState;
  };

  switch (action.type) {
    case 'START_ROUND_PAYOUTS': {
      // Validators receive posReward TK from treasury
      let players = clonePlayers();
      let treasury = state.treasury;
      let reward = state.settings.posReward;
      players.forEach(p => {
        if (p.role === 'validator' && treasury >= reward) {
          p.balance += reward;
          p.history = [{ amount: reward, reason: 'POS Reward' }, ...p.history].slice(0, 10);
          treasury -= reward;
        }
      });
      return { 
        ...state, 
        players, 
        treasury, 
        phase: 'TURN', 
        logs: addLog(`Validators received their ${reward} TK POS reward.`) 
      };
    }
    
    case 'ACTION_WORK_MINT': {
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      let reward = state.settings.mintReward;
      if (state.treasury >= reward) {
        players[pIdx].balance += reward;
        players[pIdx].history = [{ amount: reward, reason: 'Work (Mint)' }, ...players[pIdx].history].slice(0, 10);
        state.treasury -= reward;
        return nextTurn({ ...state, players, treasury: state.treasury, logs: addLog(`${players[pIdx].name} worked and minted ${reward} TK.`) });
      }
      return state;
    }

    case 'ACTION_SECURE': {
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      let cost = state.settings.secureCost;
      let gain = state.settings.secureGain;
      if (players[pIdx].balance >= cost) {
        players[pIdx].balance -= cost;
        players[pIdx].history = [{ amount: -cost, reason: 'Secure Network' }, ...players[pIdx].history].slice(0, 10);
        state.treasury += cost;
        state.securityLevel += gain;
        return nextTurn({ ...state, players, securityLevel: state.securityLevel, logs: addLog(`${players[pIdx].name} secured the network. Security is now ${state.securityLevel}.`) });
      }
      return state;
    }

    case 'ACTION_TRANSACT_INIT': {
      // Init a puzzle race because of transact. 
      let { targetPlayerId, amount } = action.payload;
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      
      const isWhaleAsynchronous = pIdx !== state.currentTurnPlayerIndex && players.find(p => p.role === 'whale' && p.id === action.payload.senderId);
      const senderIdx = action.payload.senderId ? state.players.findIndex(p => p.id === action.payload.senderId) : pIdx;

      let fee = state.settings.gasFee;
      let totalCost = amount + fee; // amount + gas fee
      if (players[senderIdx].balance >= totalCost) {
        players[senderIdx].balance -= totalCost;
        players[senderIdx].history = [{ amount: -totalCost, reason: `Sent TK to P${targetPlayerId}` }, ...players[senderIdx].history].slice(0, 10);
        return {
          ...state,
          players,
          phase: 'PUZZLE_RACE',
          pendingAction: { type: 'TRANSACT', amount, targetPlayerId, senderIdx, fee },
          logs: addLog(`${players[senderIdx].name} initiated a transaction of ${amount} TK. Puzzle Race started!`)
        };
      }
      return state;
    }

    case 'RESOLVE_PUZZLE_RACE': {
      // Miner who won gets the fee.
      let { winnerMinerId } = action.payload;
      let players = clonePlayers();
      let winnerIdx = players.findIndex(p => p.id === winnerMinerId);
      let fee = state.pendingAction.fee || state.settings.gasFee;

      players[winnerIdx].balance += fee;
      players[winnerIdx].history = [{ amount: fee, reason: 'Transaction Fee' }, ...players[winnerIdx].history].slice(0, 10);

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
        let players = clonePlayers();
        let yesVotes = 0;
        let noVotes = 0;

        Object.entries(pendingAction.votes).forEach(([vId, v]) => {
           let voter = players.find(p => p.id === parseInt(vId));
           let weight = state.settings.roles[voter.role]?.voteWeight ?? 1;
           if (v === 'YES') yesVotes += weight;
           else if (v === 'NO') noVotes += weight;
        });

        let logs;
        let treasury = state.treasury;

        if (yesVotes > noVotes) { // Success
          // NO voters pay penalty depending on role
          let penaltySum = 0;
          players.forEach(p => {
             if (pendingAction.votes[p.id] === 'NO') {
                let rulePenalty = state.settings.roles[p.role]?.attackSuccessPenalty ?? 5;
                let paid = Math.min(p.balance, rulePenalty);
                if (paid > 0) {
                    p.balance -= paid;
                    p.history = [{ amount: -paid, reason: 'Attack Penalty' }, ...p.history].slice(0, 10);
                    penaltySum += paid;
                }
             }
          });
          // Distributed to Attacker + YES voters
          let receivers = [players[pendingAction.attackerIdx], ...players.filter(p => pendingAction.votes[p.id] === 'YES')];
          let split = Math.floor(penaltySum / receivers.length);
          if (split > 0) {
              receivers.forEach(r => {
                 r.balance += split;
                 r.history = [{ amount: split, reason: 'Attack Loot' }, ...r.history].slice(0, 10);
              });
          }
          logs = addLog(`51% Attack SUCCESS. NO-voters penalized.`);
        } else { // Failure
          // Attacker + YES voters forfeit investment/penalized
          players.forEach(p => {
             if (pendingAction.votes[p.id] === 'YES' || p.id === players[pendingAction.attackerIdx].id) {
                let rulePenalty = state.settings.roles[p.role]?.attackFailPenalty ?? 0;
                let paid = Math.min(p.balance, rulePenalty);
                if (paid > 0) {
                    p.balance -= paid;
                    p.history = [{ amount: -paid, reason: 'Attack Failed Penalty' }, ...p.history].slice(0, 10);
                    treasury += paid;
                }
             }
          });
          treasury += pendingAction.cost; // Add attacker's initial cost to treasury
          
          // NO voters split reward pool from treasury
          let noVoters = players.filter(p => pendingAction.votes[p.id] === 'NO');
          let rewardPool = state.settings.defenseRewardPool;
          if (treasury >= rewardPool && noVoters.length > 0) {
            treasury -= rewardPool;
            let split = Math.floor(rewardPool / noVoters.length);
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
       let { proposedOption, title } = action.payload; // Passed from UI
       return { 
         ...state, 
         phase: 'UPDATE_VOTE', 
         pendingAction: { proposedOption, title, votes: {} }, 
         logs: addLog(`Developer proposed: ${proposedOption.title}. Network is voting.`) 
       };
    }

    case 'SUBMIT_UPDATE_VOTE': {
       let { voterId, vote } = action.payload; // vote is 'YES' or 'NO'
       let pendingAction = { ...state.pendingAction, votes: { ...state.pendingAction.votes, [voterId]: vote } };
       
       let nextState = { ...state, pendingAction };

       if (Object.keys(pendingAction.votes).length >= 6) {
          let players = clonePlayers();
          let yesVotes = 0;
          let noVotes = 0;
          
          Object.entries(pendingAction.votes).forEach(([vId, v]) => {
             let voter = players.find(p => p.id === parseInt(vId));
             let weight = state.settings.roles[voter.role]?.voteWeight ?? 1;
             if (v === 'YES') yesVotes += weight;
             else if (v === 'NO') noVotes += weight;
          });

          let logs;

          if (yesVotes > noVotes) {
            logs = addLog(`Blockchain Update Approved: ${pendingAction.proposedOption.title}.`);
            let outcome = pendingAction.proposedOption;

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
          } else {
            logs = addLog(`Blockchain Update Rejected. Majority voted NO or tied.`);
          }

          if (state.round >= state.settings.maxRounds) {
             let winner = players.reduce((prev, current) => (prev.balance > current.balance) ? prev : current);
             return { ...state, players, phase: 'GAME_OVER', winner, logs: addLog(`GAME OVER! ${winner.name} wins with ${winner.balance} TK!`) };
          } else {
             return { ...state, players, phase: 'START_ROUND', pendingAction: null, round: state.round + 1, currentTurnPlayerIndex: 0, logs };
          }
       }
       return nextState;
    }

    case 'UPDATE_SETTINGS': {
      return { ...state, settings: action.payload };
    }

    case 'APPLY_SETTINGS_AND_RESTART': {
      return createInitialState(action.payload);
    }

    case 'RESET_GAME':
      return createInitialState(state.settings);

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

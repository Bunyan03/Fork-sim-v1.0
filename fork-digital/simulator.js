

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

const getInitialState = () => ({
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
});

function gameReducer(state, action) {
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
      return state; // If treasury < 1, you can't work!
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
      let { targetPlayerId, amount, senderId } = action.payload;
      let players = clonePlayers();
      let pIdx = state.currentTurnPlayerIndex;
      
      const isWhaleAsynchronous = pIdx !== state.currentTurnPlayerIndex && players.find(p => p.role === 'whale' && p.id === senderId);
      const senderIdx = senderId ? state.players.findIndex(p => p.id === senderId) : pIdx;

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
       
       let tempRole = players[pIdx].role;
       let tempName = players[pIdx].name;
       players[pIdx].role = players[targetIdx].role;
       players[pIdx].name = players[targetIdx].name.replace(' (Swapped)', '') + ' (Swapped)';
       players[targetIdx].role = tempRole;
       players[targetIdx].name = tempName.replace(' (Swapped)', '') + ' (Swapped)';

       return nextTurn({ ...state, players, logs: addLog(`Roles swapped between Player ${pIdx+1} and Player ${targetIdx+1}.`) });
    }

    case 'DEVELOPER_CHOOSE_UPDATE': {
       let { proposedOption, title } = action.payload; 
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
          let yesVotes = Object.values(pendingAction.votes).filter(v => v === 'YES').length;
          let noVotes = Object.values(pendingAction.votes).filter(v => v === 'NO').length;
          let players = clonePlayers();
          let logs;

          if (yesVotes > noVotes) {
            logs = addLog(`Blockchain Update Approved: ${pendingAction.proposedOption.title}.`);
            let outcome = pendingAction.proposedOption;
            if (outcome.effect === 'MINT_BONUS') {
              players.forEach(p => p.balance += 2);
            } else if (outcome.effect === 'SECURE_PENALTY') {
               state.securityLevel = Math.max(1, state.securityLevel - 2);
            }
          } else {
            logs = addLog(`Blockchain Update Rejected. Majority voted NO or tied.`);
          }

          if (state.round >= 10) {
             let winner = players.reduce((prev, current) => (prev.balance > current.balance) ? prev : current);
             return { ...state, players, phase: 'GAME_OVER', winner, logs: addLog(`GAME OVER! ${winner.name} wins with ${winner.balance} TK!`) };
          } else {
             return { ...state, players, phase: 'START_ROUND', pendingAction: null, round: state.round + 1, currentTurnPlayerIndex: 0, logs };
          }
       }
       return nextState;
    }

    case 'END_ROUND': { // This handles Developer drawing card -> Developer choose update
       return state;
    }

    default:
      return state;
  }
}

// -------------------------------------------------------------
// BOT SIMULATOR
// -------------------------------------------------------------

function runSimulation(numGames) {
    let result = {
        totalGames: 0,
        winsByRole: { miner: 0, whale: 0, developer: 0, validator: 0 },
        negativeTreasuryCount: 0,
        negativePlayerBalanceCount: 0,
        crashesCount: 0,
        infiniteLoopCount: 0,
        averageBalances: [0,0,0,0,0,0],
        totalTurns: 0,
        flaws: []
    }
    
    for (let sim = 0; sim < numGames; sim++) {
        let state = getInitialState();
        let iters = 0;
        let crashed = false;
        
        while (state.phase !== 'GAME_OVER' && iters < 5000) {
            iters++;
            
            // Log issues
            if (state.treasury < 0 && !result.flaws.includes("Treasury went negative!")) {
                result.flaws.push("Treasury went negative!");
                result.negativeTreasuryCount++;
            }
            state.players.forEach(p => {
                if (p.balance < 0 && !result.flaws.includes("Player balance went negative!")) {
                    result.flaws.push("Player balance went negative!");
                    result.negativePlayerBalanceCount++;
                }
            });

            try {
                if (state.phase === 'START_ROUND') {
                    state = gameReducer(state, { type: 'START_ROUND_PAYOUTS' });
                } 
                else if (state.phase === 'TURN') {
                    let currentPlayer = state.players[state.currentTurnPlayerIndex];
                    let possibleActions = [];
                    
                    // Possible Turn Actions
                    if (state.treasury >= 1) possibleActions.push('ACTION_WORK_MINT');
                    if (currentPlayer.balance >= 2) possibleActions.push('ACTION_SECURE');
                    if (currentPlayer.balance >= 3) possibleActions.push('ACTION_TRANSACT_INIT'); // min 1 + 2 tax
                    if (currentPlayer.balance >= state.securityLevel) possibleActions.push('ACTION_CORRUPT_INIT');
                    
                    // Random action switch
                    let safeActionChosen = false;
                    while(!safeActionChosen) {
                        if (possibleActions.length === 0) {
                            // Can't do anything, forced to next Turn (wait, game doesn't have an idle action? Flaw!)
                            if (!result.flaws.includes("Player can get stuck with no valid actions in TURN phase!")) {
                                result.flaws.push("Player can get stuck with no valid actions in TURN phase!");
                            }
                            // Force next turn to prevent infinite loop
                            let nextIndex = state.currentTurnPlayerIndex + 1;
                            if (nextIndex >= 6) {
                              state.phase = 'END_ROUND';
                              let cards = state.deck.splice(0, 1);
                              if (cards.length < 1) cards = [...cards, ...shuffle(UPDATE_CARDS).splice(0, 1 - cards.length)];
                              state.drawnCards = cards;
                            } else {
                              state.currentTurnPlayerIndex = nextIndex;
                            }
                            safeActionChosen = true;
                            break;
                        }
                        
                        let randomAction = possibleActions[Math.floor(Math.random() * possibleActions.length)];
                        
                        let nextState;
                        if (randomAction === 'ACTION_WORK_MINT') {
                            nextState = gameReducer(state, { type: 'ACTION_WORK_MINT' });
                        } else if (randomAction === 'ACTION_SECURE') {
                            nextState = gameReducer(state, { type: 'ACTION_SECURE' });
                        } else if (randomAction === 'ACTION_TRANSACT_INIT') {
                            let targets = state.players.filter(p => p.id !== currentPlayer.id);
                            let randomTarget = targets[Math.floor(Math.random() * targets.length)];
                            nextState = gameReducer(state, { 
                                type: 'ACTION_TRANSACT_INIT', 
                                payload: { targetPlayerId: randomTarget.id, amount: 1, senderId: currentPlayer.id } 
                            });
                        } else if (randomAction === 'ACTION_CORRUPT_INIT') {
                            nextState = gameReducer(state, { type: 'ACTION_CORRUPT_INIT' });
                        }
                        
                        if (nextState === state) {
                            possibleActions = possibleActions.filter(a => a !== randomAction);
                        } else {
                            state = nextState;
                            safeActionChosen = true;
                        }
                    }
                } 
                else if (state.phase === 'PUZZLE_RACE') {
                    // One random player wins
                    let randomWinner = state.players[Math.floor(Math.random() * 6)];
                    state = gameReducer(state, { 
                        type: 'RESOLVE_PUZZLE_RACE', 
                        payload: { winnerMinerId: randomWinner.id } 
                    });
                } 
                else if (state.phase === '51_ATTACK_VOTE') {
                    let attackerIdx = state.pendingAction.attackerIdx;
                    let attackerId = state.players[attackerIdx].id;
                    state.players.forEach(p => {
                        if (p.id !== attackerId) {
                            let randomVote = Math.random() > 0.5 ? 'YES' : 'NO';
                            state = gameReducer(state, { 
                                type: 'SUBMIT_ATTACK_VOTE', 
                                payload: { voterId: p.id, vote: randomVote } 
                            });
                        }
                    });
                }
                else if (state.phase === 'END_ROUND') {
                    // Developer chooses
                    let aOrB = Math.random() > 0.5 ? 'optionA' : 'optionB';
                    let card = state.drawnCards && state.drawnCards[0] ? state.drawnCards[0] : UPDATE_CARDS[0];
                    state = gameReducer(state, { 
                        type: 'DEVELOPER_CHOOSE_UPDATE', 
                        payload: { proposedOption: card[aOrB], title: card.title } 
                    });
                }
                else if (state.phase === 'UPDATE_VOTE') {
                    state.players.forEach(p => {
                        let randomVote = Math.random() > 0.5 ? 'YES' : 'NO';
                        state = gameReducer(state, { 
                            type: 'SUBMIT_UPDATE_VOTE', 
                            payload: { voterId: p.id, vote: randomVote } 
                        });
                    });
                } else {
                   // unknown phase? break to prevent infinite
                   iters = 5000;
                }
            } catch (e) {
                if (!result.flaws.includes("Simulation crashed! " + e.message)) {
                    result.flaws.push("Simulation crashed! " + e.message);
                }
                crashed = true;
                result.crashesCount++;
                break; // Break the current game loop
            }
        }
        
        if (iters >= 5000) {
            result.infiniteLoopCount++;
            if (!result.flaws.includes("Game hit an infinite loop / deadlock!")) {
                 result.flaws.push("Game hit an infinite loop / deadlock!");
            }
        } else if (!crashed) {
            result.totalGames++;
            if (state.winner) {
                let winRole = state.players.find(p => p.id === state.winner.id).role;
                result.winsByRole[winRole] = (result.winsByRole[winRole] || 0) + 1;
            }
            state.players.forEach((p, idx) => {
                result.averageBalances[idx] += p.balance;
            });
            result.totalTurns += iters;
        }
    }
    
    // Process results
    if (result.totalGames > 0) {
        for(let i=0; i<6; i++) {
            result.averageBalances[i] = (result.averageBalances[i] / result.totalGames).toFixed(2);
        }
    }
    
    console.log("=== FORK SIMULATION RESULTS ===");
    console.log(`Total Games Simulated: ${result.totalGames}`);
    console.log(`Failed/Crashed Games: ${result.crashesCount}`);
    console.log(`Infinite Loop / Deadlocks: ${result.infiniteLoopCount}`);
    console.log("");
    console.log("--- WIN RATES BY ROLE ---");
    let totalWins = result.totalGames || 1; 
    console.log(`Validator: ${((result.winsByRole.validator / totalWins)*100).toFixed(1)}%`);
    console.log(`Miner:     ${((result.winsByRole.miner / totalWins)*100).toFixed(1)}%`);
    console.log(`Whale:     ${((result.winsByRole.whale / totalWins)*100).toFixed(1)}%`);
    console.log(`Developer: ${((result.winsByRole.developer / totalWins)*100).toFixed(1)}%`);
    console.log("");
    console.log("--- AVERAGE FINAL BALANCES ---");
    console.log(`Player 1 (Miner): ${result.averageBalances[0]}`);
    console.log(`Player 2 (Miner): ${result.averageBalances[1]}`);
    console.log(`Player 3 (Whale): ${result.averageBalances[2]}`);
    console.log(`Player 4 (Developer): ${result.averageBalances[3]}`);
    console.log(`Player 5 (Validator): ${result.averageBalances[4]}`);
    console.log(`Player 6 (Validator): ${result.averageBalances[5]}`);
    console.log("");
    console.log("--- LOGICAL FLAWS FOUND ---");
    if (result.flaws.length === 0) console.log("None detected! :)");
    else result.flaws.forEach(f => console.log(`- ${f}`));
    console.log("");
    console.log(`Times Treasury went negative: ${result.negativeTreasuryCount}`);
    console.log(`Times Player Balance went negative: ${result.negativePlayerBalanceCount}`);
}

runSimulation(10000);

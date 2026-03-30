import { gameReducer, createInitialState } from '../context/GameState.jsx';

export function simulateGame(settings) {
    let state = createInitialState(settings);
    // Safety break to prevent infinite loops
    let maxSteps = 10000;
    let steps = 0;
    
    while (state.phase !== 'GAME_OVER' && steps < maxSteps) {
        state = stepSimulation(state);
        steps++;
    }
    
    return state;
}

function stepSimulation(state) {
    if (state.phase === 'START_ROUND') {
        return gameReducer(state, { type: 'START_ROUND_PAYOUTS' });
    }
    if (state.phase === 'TURN') {
        let pIdx = state.currentTurnPlayerIndex;
        let p = state.players[pIdx];
        
        // Define possible actions for the bot
        let validActions = ['ACTION_WORK_MINT'];
        
        if (p.balance >= state.settings.secureCost) {
            validActions.push('ACTION_SECURE');
            validActions.push('ACTION_SECURE'); // Weigh secure higher so they do it 
        }
        if (p.balance >= state.securityLevel) {
            // Give it a 25% chance of corrupting if able, to prevent continuous attacking loop.
            if (Math.random() < 0.25) validActions.push('ACTION_CORRUPT_INIT');
        }
        if (p.balance >= state.settings.gasFee + 1) {
            validActions.push('ACTION_TRANSACT_INIT');
            validActions.push('ACTION_TRANSACT_INIT');
        }
        
        let actionStr = validActions[Math.floor(Math.random() * validActions.length)];
        
        if (actionStr === 'ACTION_TRANSACT_INIT') {
            let targetId = Math.floor(Math.random() * 6) + 1;
            while(targetId === p.id) targetId = Math.floor(Math.random() * 6) + 1;
            return gameReducer(state, { type: 'ACTION_TRANSACT_INIT', payload: { senderId: p.id, targetPlayerId: targetId, amount: 1 } });
        }
        return gameReducer(state, { type: actionStr });
    }
    if (state.phase === 'PUZZLE_RACE') {
        let miners = state.players.filter(p => p.role === 'miner');
        let winner = miners[Math.floor(Math.random() * miners.length)];
        return gameReducer(state, { type: 'RESOLVE_PUZZLE_RACE', payload: { winnerMinerId: winner.id } });
    }
    if (state.phase === '51_ATTACK_VOTE' || state.phase === 'UPDATE_VOTE') {
        let players = state.players;
        let stateRef = state;
        
        players.forEach(p => {
            if (state.phase === '51_ATTACK_VOTE' && p.id === state.players[state.pendingAction.attackerIdx].id) return;
            // 50/50 vote chance
            let vote = Math.random() > 0.5 ? 'YES' : 'NO';
            stateRef = gameReducer(stateRef, { 
                type: state.phase === '51_ATTACK_VOTE' ? 'SUBMIT_ATTACK_VOTE' : 'SUBMIT_UPDATE_VOTE', 
                payload: { voterId: p.id, vote } 
            });
        });
        return stateRef;
    }
    if (state.phase === 'END_ROUND') {
        let card = state.drawnCards[0];
        let proposedOption = Math.random() > 0.5 ? card.optionA : card.optionB;
        return gameReducer(state, { type: 'DEVELOPER_CHOOSE_UPDATE', payload: { proposedOption, title: card.title } });
    }
    
    // Fallback exactly to return an unmodified or progressed state (so loop terminates eventually on bug)
    return { ...state, phase: 'GAME_OVER' };
}

export function runSimulations(iterations, settings) {
    let winCounts = {
        miner: 0,
        whale: 0,
        developer: 0,
        validator: 0
    };
    
    let totalBalances = {
        miner: 0,
        whale: 0,
        developer: 0,
        validator: 0
    };
    
    let totalSecurityLevel = 0;
    let totalTreasury = 0;

    for (let i = 0; i < iterations; i++) {
        let finalState = simulateGame(settings);
        
        // Aggregate Win Counts
        if (finalState.winner && finalState.winner.role) {
            winCounts[finalState.winner.role] += 1;
        }
        
        // Aggregate Balances 
        finalState.players.forEach(p => {
            if(totalBalances[p.role] !== undefined) {
               totalBalances[p.role] += (p.balance || 0);
            }
        });
        
        totalSecurityLevel += finalState.securityLevel;
        totalTreasury += finalState.treasury;
    }

    let roleCounts = { miner: 2, whale: 1, developer: 1, validator: 2 };

    return {
        iterations,
        winRates: Object.keys(winCounts).map(role => ({
            role,
            winRate: Number(((winCounts[role] / iterations) * 100).toFixed(1))
        })),
        avgBalances: Object.keys(totalBalances).map(role => ({
            role,
            avgBalance: Math.round(totalBalances[role] / (iterations * roleCounts[role]))
        })),
        avgSecurity: (totalSecurityLevel / iterations).toFixed(2),
        avgTreasury: Math.round(totalTreasury / iterations)
    };
}

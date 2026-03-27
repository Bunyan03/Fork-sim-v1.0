import { useState, useEffect } from 'react';
import { useGameState } from './context/GameState';
import GameBoard from './components/GameBoard';
import PuzzleRaceModal from './components/Modals/PuzzleRaceModal';
import VoteModal from './components/Modals/VoteModal';
import DeveloperUpdateModal from './components/Modals/DeveloperUpdateModal';
import GameInfoModal from './components/Modals/GameInfoModal';

function App() {
  const { state, dispatch } = useGameState();
  const [showInfo, setShowInfo] = useState(false);

  // Handle auto-payout for validators when round starts
  useEffect(() => {
    if (state.phase === 'START_ROUND') {
      setTimeout(() => {
        dispatch({ type: 'START_ROUND_PAYOUTS' });
      }, 1000);
    }
  }, [state.phase, dispatch]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-title">FORK <span style={{fontSize:'1rem', color:'#fff', marginLeft: '0.5rem'}}>DIGITAL</span></div>
        <div className="stats-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="action-btn" 
              style={{ padding: '0', fontSize: '1.5rem', fontWeight: 900, borderRadius: '50%', width: '45px', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              onClick={() => setShowInfo(true)}
              title="Game Instructions"
            >
              ?
            </button>
            <div className="stat-item">
              <span className="stat-label">Round</span>
              <span className="stat-value">{state.round} / 10</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-label">Security Level</span>
            <span className="stat-value" style={{color: 'var(--primary-color)'}}>{state.securityLevel}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Treasury</span>
            <span className="stat-value">{state.treasury} TK</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <GameBoard />
        
        <div className="side-panel">
          <div className="log-panel" style={{ height: '100%' }}>
            {state.logs.map((log, i) => (
              <div key={i} className="log-entry">{log}</div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals for different phases */}
      {showInfo && <GameInfoModal onClose={() => setShowInfo(false)} />}
      {state.phase === 'PUZZLE_RACE' && <PuzzleRaceModal />}
      {state.phase === 'END_ROUND' && <DeveloperUpdateModal />}
      {(state.phase === '51_ATTACK_VOTE' || state.phase === 'UPDATE_VOTE') && <VoteModal />}
      {state.phase === 'GAME_OVER' && (
        <div className="modal-overlay">
          <div className="modal-content" style={{textAlign: 'center'}}>
            <h2 className="modal-title" style={{fontSize: '3rem', color: 'var(--gold)'}}>GAME OVER</h2>
            <p style={{fontSize: '1.5rem', margin: '2rem 0'}}>Winner: <b>{state.winner?.name}</b></p>
            <p>Score: {state.winner?.balance} TK</p>
            <button className="action-btn btn-primary" onClick={() => dispatch({type: 'RESET_GAME'})}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

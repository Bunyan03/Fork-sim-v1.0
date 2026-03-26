import { useState, useEffect } from 'react';
import { useGameState } from '../context/GameState';

export default function ActionPanel() {
  const { state, dispatch } = useGameState();
  const [transactAmount, setTransactAmount] = useState(1);
  const [transactTarget, setTransactTarget] = useState(null);
  const [roleSwapTarget, setRoleSwapTarget] = useState(null);
  
  // 'NONE', 'TRANSACT', 'ROLE_SWITCH'
  const [activeForm, setActiveForm] = useState('NONE');

  const currentPlayer = state.players[state.currentTurnPlayerIndex];

  // Set default targets when a form is opened
  useEffect(() => {
    if (!currentPlayer) return;
    const otherPlayers = state.players.filter(p => p.id !== currentPlayer.id);
    if (otherPlayers.length > 0) {
      if (!transactTarget) setTransactTarget(otherPlayers[0].id);
      if (!roleSwapTarget) setRoleSwapTarget(otherPlayers[0].id);
    }
  }, [currentPlayer, state.players]);

  // Reset forms when turn changes
  useEffect(() => {
    setActiveForm('NONE');
  }, [state.currentTurnPlayerIndex]);

  if (state.phase !== 'TURN') {
    return (
      <div className="action-dashboard">
        <h2 className="dashboard-title">System processing...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Waiting for phase: {state.phase}</p>
      </div>
    );
  }

  const handleTransactSubmit = () => {
    dispatch({ type: 'ACTION_TRANSACT_INIT', payload: { targetPlayerId: transactTarget, amount: transactAmount }});
    setActiveForm('NONE');
  }

  const handleRoleSwapSubmit = () => {
    dispatch({ type: 'ACTION_ROLE_SWITCH', payload: { targetPlayerId: roleSwapTarget }});
    setActiveForm('NONE');
  }

  return (
    <div className="action-dashboard">
      <h2 className="dashboard-title">{currentPlayer.name}'s Action</h2>
      
      {activeForm === 'NONE' && (
        <>
          <button 
            className="action-btn"
            disabled={state.treasury < 1}
            onClick={() => dispatch({ type: 'ACTION_WORK_MINT' })}
          >
            <span>Work (Mint)</span>
            <span style={{color: 'var(--secondary-color)'}}>+1 TK</span>
          </button>

          <button 
            className="action-btn"
            disabled={currentPlayer.balance < 2}
            onClick={() => dispatch({ type: 'ACTION_SECURE' })}
          >
            <span>Secure Network</span>
            <span style={{color: 'var(--danger-color)'}}>-2 TK</span>
          </button>

          <button 
            className="action-btn"
            disabled={currentPlayer.balance < 3} // minimum 1 TK + 2 TK fee
            onClick={() => setActiveForm('TRANSACT')}
          >
            <span>Transact</span>
            <span style={{color: 'var(--danger-color)'}}>Fee: 2 TK</span>
          </button>

          <button 
            className="action-btn btn-danger"
            disabled={currentPlayer.balance < state.securityLevel}
            onClick={() => dispatch({ type: 'ACTION_CORRUPT_INIT' })}
          >
            <span>Corrupt</span>
            <span>Cost: {state.securityLevel} TK</span>
          </button>

          <button 
            className="action-btn"
            onClick={() => setActiveForm('ROLE_SWITCH')}
          >
            <span>Role Switch</span>
          </button>
        </>
      )}

      {activeForm === 'TRANSACT' && (
        <div className="quirk-box">
          <div className="quirk-box-title">Transact Details</div>
          <div className="form-group">
            <label>Receiver</label>
            <select 
              className="form-control" 
              value={transactTarget || ''}
              onChange={e => setTransactTarget(Number(e.target.value))}
            >
              {state.players.filter(p => p.id !== currentPlayer.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Amount (TK)</label>
            <input 
              type="number" 
              className="form-control" 
              value={transactAmount} 
              onChange={e => setTransactAmount(Number(e.target.value))}
              min="1" 
              max={currentPlayer.balance - 2}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              className="action-btn btn-primary" 
              style={{ flex: 2 }}
              disabled={currentPlayer.balance < transactAmount + 2 || transactAmount < 1}
              onClick={handleTransactSubmit}
            >
              Confirm Send
            </button>
            <button 
              className="action-btn" 
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setActiveForm('NONE')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeForm === 'ROLE_SWITCH' && (
        <div className="quirk-box">
          <div className="quirk-box-title">Role Switch Target</div>
          <div className="form-group">
            <label>Select Player to Swap</label>
            <select 
              className="form-control" 
              value={roleSwapTarget || ''}
              onChange={e => setRoleSwapTarget(Number(e.target.value))}
            >
              {state.players.filter(p => p.id !== currentPlayer.id).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              className="action-btn btn-primary" 
              style={{ flex: 2 }}
              onClick={handleRoleSwapSubmit}
            >
              Confirm Swap
            </button>
            <button 
              className="action-btn" 
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setActiveForm('NONE')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

import { useGameState } from '../context/GameState';

export default function GameBoard() {
  const { state } = useGameState();

  return (
    <div className="game-board">
      {state.players.map((player, index) => {
        const isCurrentTurn = index === state.currentTurnPlayerIndex && state.phase === 'TURN';
        return (
          <div key={player.id} className={`player-card ${isCurrentTurn ? 'active' : ''}`}>
            <div>
              <div className="player-header">
                <span className="player-name">{player.name}</span>
                <span className={`player-role role-${player.role}`}>{player.role}</span>
              </div>
              <div className="balance-display">
                <span className="tk-symbol">TK</span>
                <span>{player.balance}</span>
              </div>
            </div>

            <div className="player-history">
              {player.history && player.history.map((entry, idx) => (
                <div key={idx} className="history-entry">
                  <span className={entry.amount > 0 ? "text-green" : "text-red"}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount}
                  </span>
                  <span className="history-reason">{entry.reason}</span>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isCurrentTurn && (
                <div style={{ color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  CURRENT TURN
                </div>
              )}
              
              {/* Show pending vote status if applicable */}
              {state.phase.includes('VOTE') && state.pendingAction?.votes && (
                <div style={{ fontSize: '0.8rem' }}>
                  Vote: {state.pendingAction.votes[player.id] ? state.pendingAction.votes[player.id] : 'Waiting...'}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useGameState } from '../../context/GameState';

export default function VoteModal() {
  const { state, dispatch } = useGameState();
  const is51Attack = state.phase === '51_ATTACK_VOTE';
  
  const pending = state.pendingAction;
  const attacker = is51Attack ? state.players[pending.attackerIdx] : null;

  const handleVote = (voterId, vote) => {
    if (is51Attack) {
      dispatch({ type: 'SUBMIT_ATTACK_VOTE', payload: { voterId, vote } });
    } else {
      dispatch({ type: 'SUBMIT_UPDATE_VOTE', payload: { voterId, vote } });
    }
  };

  // For 51% attack, attacker doesn't vote.
  const voters = is51Attack 
    ? state.players.filter(p => p.id !== attacker.id)
    : state.players;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '600px'}}>
        <h2 className="modal-title" style={{color: is51Attack ? 'var(--danger-color)' : 'var(--primary-color)'}}>
          {is51Attack ? '51% ATTACK INITIATED!' : 'BLOCKCHAIN UPDATE PROPOSED'}
        </h2>
        
        {is51Attack ? (
          <p style={{textAlign: 'center', marginBottom: '2rem'}}>
            <b>{attacker.name}</b> has invested {pending.cost} TK to corrupt the network!<br/>
            Vote YES to join the attack. Vote NO to defend.
          </p>
        ) : (
          <div style={{marginBottom: '2rem'}}>
            <p style={{textAlign: 'center'}}>The Developer has proposed a choice. The network must decide.</p>
            <div className="vote-grid">
              <div style={{padding: '1rem', border: '1px solid var(--primary-color)', borderRadius: '8px'}}>
                <h3>Option A</h3>
                <p>{pending.optionA?.title}</p>
              </div>
              <div style={{padding: '1rem', border: '1px solid var(--gold)', borderRadius: '8px'}}>
                <h3>Option B</h3>
                <p>{pending.optionB?.title}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {voters.map(voter => {
            const hasVoted = !!pending.votes[voter.id];
            
            return (
              <div key={voter.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'}}>
                <span>{voter.name} ({voter.role})</span>
                
                {hasVoted ? (
                  <span style={{color: 'var(--secondary-color)', fontWeight: 'bold'}}>Voted</span>
                ) : (
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    {is51Attack ? (
                      <>
                        <button className="action-btn btn-danger" style={{padding: '0.5rem 1rem'}} onClick={() => handleVote(voter.id, 'YES')}>YES</button>
                        <button className="action-btn btn-primary" style={{padding: '0.5rem 1rem', background: 'var(--secondary-color)'}} onClick={() => handleVote(voter.id, 'NO')}>NO</button>
                      </>
                    ) : (
                      <>
                        <button className="action-btn" style={{padding: '0.5rem 1rem', borderColor: 'var(--primary-color)'}} onClick={() => handleVote(voter.id, 'A')}>Vote A</button>
                        <button className="action-btn" style={{padding: '0.5rem 1rem', borderColor: 'var(--gold)'}} onClick={() => handleVote(voter.id, 'B')}>Vote B</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useGameState } from '../../context/GameState';

export default function DeveloperUpdateModal() {
  const { state, dispatch } = useGameState();

  const handleChoose = (card, optionName) => {
    const proposedOption = optionName === 'A' ? card.optionA : card.optionB;
    dispatch({ type: 'DEVELOPER_CHOOSE_UPDATE', payload: { proposedOption, title: card.title } });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '800px'}}>
        <h2 className="modal-title" style={{color: 'var(--primary-color)'}}>DEVELOPER: CHOOSE OPTION TO PROPOSE</h2>
        <p style={{textAlign: 'center', marginBottom: '2rem'}}>You have drawn a protocol update card. Pick Option A or Option B to propose to the network.</p>

        <div>
          {state.drawnCards.map(card => (
            <div key={card.id} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <h3 style={{marginTop: 0, textAlign: 'center', color: 'var(--gold)', fontSize: '2rem'}}>{card.title}</h3>
              <div className="vote-grid" style={{ gap: '2rem', marginTop: 0 }}>
                {/* Option A Block */}
                <div style={{
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  border: '2px solid var(--primary-color)',
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  background: '#fdfdfd'
                }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem' }}>Option A</h4>
                  <div style={{ flex: 1, fontSize: '1.1rem' }}>{card.optionA.title}</div>
                  <button className="action-btn btn-primary" onClick={() => handleChoose(card, 'A')}>Propose Option A</button>
                </div>

                {/* Option B Block */}
                <div style={{
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  border: '2px solid var(--gold)',
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                  background: '#fdfdfd'
                }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem' }}>Option B</h4>
                  <div style={{ flex: 1, fontSize: '1.1rem' }}>{card.optionB.title}</div>
                  <button className="action-btn" style={{ borderColor: 'var(--gold)' }} onClick={() => handleChoose(card, 'B')}>Propose Option B</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

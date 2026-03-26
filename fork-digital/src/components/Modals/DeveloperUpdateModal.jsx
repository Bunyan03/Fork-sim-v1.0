import { useGameState } from '../../context/GameState';

export default function DeveloperUpdateModal() {
  const { state, dispatch } = useGameState();

  const handleChoose = (card) => {
    dispatch({ type: 'DEVELOPER_CHOOSE_UPDATE', payload: { chosenCard: card } });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '800px'}}>
        <h2 className="modal-title" style={{color: 'var(--primary-color)'}}>DEVELOPER: CHOOSE UPDATE TO PROPOSE</h2>
        <p style={{textAlign: 'center', marginBottom: '2rem'}}>You have drawn 2 protocol update cards. Pick 1 to propose to the network.</p>

        <div className="vote-grid" style={{gap: '2rem'}}>
          {state.drawnCards.map(card => (
            <div key={card.id} style={{
              background: 'var(--card-bg)', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h3 style={{marginTop: 0, textAlign: 'center', color: 'var(--gold)'}}>{card.title}</h3>
              <div style={{flex: 1}}>
                <div style={{marginBottom: '1rem'}}>
                  <b>Option A:</b> {card.optionA.title}
                </div>
                <div>
                  <b>Option B:</b> {card.optionB.title}
                </div>
              </div>
              <button className="action-btn btn-primary" onClick={() => handleChoose(card)}>Propose This Update</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameState';

export default function PuzzleRaceModal() {
  const { state, dispatch } = useGameState();
  const [problem, setProblem] = useState({ q: '', a: 0 });
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');

  const miners = state.players.filter(p => p.role === 'miner');
  const miner1 = miners[0];
  const miner2 = miners[1];

  useEffect(() => {
    // Generate a simple math problem
    const num1 = Math.floor(Math.random() * 20) + 5;
    const num2 = Math.floor(Math.random() * 20) + 5;
    const isAdd = Math.random() > 0.5;
    
    if (isAdd) {
      setProblem({ q: `${num1} + ${num2}`, a: num1 + num2 });
    } else {
      let max = Math.max(num1, num2);
      let min = Math.min(num1, num2);
      setProblem({ q: `${max} - ${min}`, a: max - min });
    }
  }, []);

  const handleInput = (minerId, val) => {
    if (parseInt(val) === problem.a) {
      // Winner!
      dispatch({ type: 'RESOLVE_PUZZLE_RACE', payload: { winnerMinerId: minerId } });
    }
  };

  if (!miner1 || !miner2) {
    // Edge case if a miner role is missing due to role swaps, auto-resolve to treasury or something.
    // For now, assume 2 miners exist.
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content puzzle-race-active">
        <h2 className="modal-title" style={{color: 'var(--gold)'}}>PUZZLE RACE!</h2>
        <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>Miners, type the answer first to win the 2 TK fee.</p>
        
        <div className="math-problem">
          {problem.q} = ?
        </div>

        <div className="vote-grid">
          <div className="form-group" style={{alignItems: 'center'}}>
            <label>{miner1.name}</label>
            <input 
              type="number" 
              className="form-control" 
              style={{fontSize: '2rem', textAlign: 'center', width: '100px'}}
              value={input1}
              onChange={e => {
                setInput1(e.target.value);
                handleInput(miner1.id, e.target.value);
              }}
              autoFocus
            />
          </div>
          <div className="form-group" style={{alignItems: 'center'}}>
            <label>{miner2.name}</label>
            <input 
              type="number" 
              className="form-control" 
              style={{fontSize: '2rem', textAlign: 'center', width: '100px'}}
              value={input2}
              onChange={e => {
                setInput2(e.target.value);
                handleInput(miner2.id, e.target.value);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

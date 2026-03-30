import { useState } from 'react';
import { useGameState } from '../../context/GameState.jsx';
import { runSimulations } from '../../utils/simulateGame';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  miner: '#d4af37',
  whale: '#3b82f6',
  developer: '#ef4444',
  validator: '#10b981'
};

export default function SimulationModal({ onClose }) {
  const { state } = useGameState();
  const [iterations, setIterations] = useState(10000);
  const [results, setResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    // Delay slightly to let the UI render the loading state
    setTimeout(() => {
      const start = Date.now();
      const res = runSimulations(iterations, state.settings);
      res.timeTaken = Date.now() - start;
      setResults(res);
      setIsSimulating(false);
    },50);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ color: 'var(--primary-color)', margin: 0 }}>BOT SIMULATION DASHBOARD</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Stress test the current game configuration by running thousands of headless games instantly.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <label style={{fontWeight: 'bold'}}>Simulations: </label>
          <select 
            value={iterations} 
            onChange={e => setIterations(Number(e.target.value))}
            style={{ padding: '0.5rem', fontSize: '1.1rem' }}
          >
            <option value={100}>100 Games</option>
            <option value={1000}>1,000 Games</option>
            <option value={5000}>5,000 Games</option>
            <option value={10000}>10,000 Games</option>
          </select>
          <button 
            className="action-btn btn-primary" 
            onClick={handleSimulate} 
            disabled={isSimulating}
            style={{ background: isSimulating ? '#ccc' : '', minWidth: '200px' }}
          >
            {isSimulating ? 'SIMULATING...' : `RUN ${iterations} SIMS`}
          </button>
        </div>

        {results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', background: '#fefefe', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{textAlign: 'center', color: '#333'}}>
                Results across {results.iterations.toLocaleString()} games ({results.timeTaken}ms)
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
              <div style={{textAlign: 'center'}}>
                 <strong>Average Core Security Level:</strong> <br/>
                 <span style={{fontSize: '1.5rem', color: 'var(--primary-color)'}}>{results.avgSecurity}</span>
              </div>
              <div style={{textAlign: 'center'}}>
                 <strong>Average Final Treasury:</strong> <br/>
                 <span style={{fontSize: '1.5rem', color: 'var(--gold)'}}>{results.avgTreasury} TK</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              
              {/* Win Rate Chart */}
              <div style={{ flex: '1 1 400px', height: '300px' }}>
                <h4 style={{textAlign: 'center', marginBottom: '1rem'}}>Win Rate (%)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.winRates}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" style={{textTransform: 'capitalize'}} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="winRate" name="Win Rate %">
                      {results.winRates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.role]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average Balance Chart */}
              <div style={{ flex: '1 1 400px', height: '300px' }}>
                <h4 style={{textAlign: 'center', marginBottom: '1rem'}}>Average Final Balance (TK)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.avgBalances}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" style={{textTransform: 'capitalize'}} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value} TK`} />
                    <Bar dataKey="avgBalance" name="Avg Balance">
                      {results.avgBalances.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.role]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

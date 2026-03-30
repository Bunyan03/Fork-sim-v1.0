import { useState } from 'react';
import { useGameState, defaultSettings } from '../../context/GameState';

export default function SettingsModal({ onClose }) {
  const { state, dispatch } = useGameState();
  const [localSettings, setLocalSettings] = useState(state.settings || defaultSettings);

  const [activeTab, setActiveTab] = useState('general');

  const handleGlobalChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleRoleChange = (role, field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [role]: {
          ...prev.roles[role],
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  const submitApply = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: localSettings });
    onClose();
  };

  const submitRestart = () => {
    dispatch({ type: 'APPLY_SETTINGS_AND_RESTART', payload: localSettings });
    onClose();
  };

  const resetToDefault = () => {
    setLocalSettings(defaultSettings);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ color: 'var(--primary-color)', margin: 0 }}>GAME SETTINGS</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>
        
        <p style={{ textAlign: 'center', marginBottom: '1rem' }}>Adjust game parameters here. Apply applies settings to future turns. Restart applies immediately and resets the board.</p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <button 
            className={`action-btn ${activeTab === 'general' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('general')}
          >General Settings</button>
          <button 
            className={`action-btn ${activeTab === 'roles' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('roles')}
          >Role Behaviors</button>
        </div>

        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <SettingRow label="Max Rounds" name="maxRounds" value={localSettings.maxRounds} onChange={handleGlobalChange} />
            <SettingRow label="Treasury Start TK" name="treasuryStart" value={localSettings.treasuryStart} onChange={handleGlobalChange} />
            
            <SettingRow label="Work (Mint) Reward TK" name="mintReward" value={localSettings.mintReward} onChange={handleGlobalChange} />
            <SettingRow label="Gas Fee TK" name="gasFee" value={localSettings.gasFee} onChange={handleGlobalChange} />
            
            <SettingRow label="Secure Network Cost TK" name="secureCost" value={localSettings.secureCost} onChange={handleGlobalChange} />
            <SettingRow label="Secure Network Gain" name="secureGain" value={localSettings.secureGain} onChange={handleGlobalChange} />
            
            <SettingRow label="POS Reward (Validators) TK" name="posReward" value={localSettings.posReward} onChange={handleGlobalChange} />
            <SettingRow label="Defense Reward Pool TK" name="defenseRewardPool" value={localSettings.defenseRewardPool} onChange={handleGlobalChange} />
          </div>
        )}

        {activeTab === 'roles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {['miner', 'whale', 'validator', 'developer'].map(role => (
              <div key={role} style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0, textTransform: 'capitalize', color: 'var(--gold)' }}>{role}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <SettingRowRole 
                    label="Starting Tokens" role={role} field="startingTokens" 
                    value={localSettings.roles[role].startingTokens} onChange={handleRoleChange} 
                  />
                  <SettingRowRole 
                    label="Vote Weight" role={role} field="voteWeight" 
                    value={localSettings.roles[role].voteWeight} onChange={handleRoleChange} 
                  />
                  <SettingRowRole 
                    label="Attack Success Penalty (NO Voters lose TK)" role={role} field="attackSuccessPenalty" 
                    value={localSettings.roles[role].attackSuccessPenalty} onChange={handleRoleChange} 
                  />
                  <SettingRowRole 
                    label="Attack Fail Penalty (YES Voters/Attacker lose TK)" role={role} field="attackFailPenalty" 
                    value={localSettings.roles[role].attackFailPenalty} onChange={handleRoleChange} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="action-btn" onClick={resetToDefault}>Restore Defaults</button>
          <button className="action-btn btn-primary" onClick={submitApply} style={{ background: '#4CAF50' }}>Apply to Current Game</button>
          <button className="action-btn btn-primary" onClick={submitRestart}>Apply & Restart Game</button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, name, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
      <label style={{ fontWeight: 'bold' }}>{label}</label>
      <input 
        type="number" 
        name={name} 
        value={value} 
        onChange={onChange}
        style={{ width: '80px', padding: '0.5rem', textAlign: 'right' }}
      />
    </div>
  );
}

function SettingRowRole({ label, role, field, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
      <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{label}</label>
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(role, field, e.target.value)}
        style={{ width: '80px', padding: '0.5rem', textAlign: 'right' }}
      />
    </div>
  );
}

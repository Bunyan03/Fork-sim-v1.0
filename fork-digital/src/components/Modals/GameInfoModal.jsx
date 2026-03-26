import React from 'react';

export default function GameInfoModal({ onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="modal-title" style={{ textAlign: 'left', borderBottom: '4px solid #000', paddingBottom: '1rem' }}>
          FORK OPERATION MANUAL
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '1.1rem', lineHeight: '1.4' }}>
          <div className="quirk-box">
            <div className="quirk-box-title">OBJECTIVE</div>
            <p>Accumulate the highest volume of Tokens (TK) by the end of Round 10.</p>
          </div>

          <div className="quirk-box">
            <div className="quirk-box-title">ROLES & STARTING CAPITAL</div>
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              <li><b>Miner (x2) - 20 TK:</b> Competes in Puzzle Races to earn transaction fees.</li>
              <li><b>Whale - 60 TK:</b> Starts with massive liquidity to influence the network.</li>
              <li><b>Developer - 15 TK:</b> Draws and proposes Blockchain Updates at the end of each round.</li>
              <li><b>Validator (x2) - 25 TK:</b> Earns a 2 TK Proof-of-Stake reward at the start of every round.</li>
            </ul>
          </div>

          <div className="quirk-box">
            <div className="quirk-box-title">TURN ACTIONS</div>
            <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li><b>Work (Mint):</b> Receive +1 TK from the Treasury Faucet.</li>
              <li><b>Secure Network:</b> Pay -2 TK to increase the Network Security Level by 1.</li>
              <li><b>Transact:</b> Send TK to another player. Requires an additional 2 TK Gas Fee, which triggers a Puzzle Race.</li>
              <li><b>Corrupt:</b> Initiate a 51% Attack to steal funds. Costs TK equal to the current Network Security Level. Triggers a network-wide vote.</li>
              <li><b>Role Switch:</b> Propose a role swap with another player.</li>
            </ul>
          </div>

          <div className="quirk-box">
            <div className="quirk-box-title">PUZZLE RACE & ATTACKS</div>
            <p><b>Puzzle Race:</b> When a transaction occurs, Miners race to solve a math problem. The first to answer wins the 2 TK Gas Fee.</p>
            <p><b>51% Attack:</b> If YES votes win, the NO voters are penalized 5 TK each, distributed to the attackers. If NO votes win, the attacker loses their investment and defenders split a 10 TK reward.</p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="action-btn btn-primary" onClick={onClose} style={{ width: '100%', fontSize: '1.5rem', padding: '1rem' }}>
            ACKNOWLEDGE & RESUME
          </button>
        </div>
      </div>
    </div>
  );
}

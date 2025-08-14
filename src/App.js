import React from 'react';
import { BattleProvider } from './context/BattleContext';
import BattleArena from './components/BattleArena';
import './App.css';

/**
 * Main App Component
 * Root component that sets up the application structure
 * and provides global context to all child components
 */
function App() {
  return (
    <div className="App">
      <BattleProvider>
        <BattleArena />
      </BattleProvider>
    </div>
  );
}

export default App;
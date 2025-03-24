import logo from './logo.svg';
import './App.css';

// src/App.js
import React from 'react';
import Map from './components/Map';

function App() {
  return (
    <div className="App">
      <h1>Our Meeting Guide</h1>
      <Map />
    </div>
  );
}

export default App;
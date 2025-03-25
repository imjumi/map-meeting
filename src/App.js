import logo from './logo.svg';
import './App.css';

// src/App.js
import React from 'react';
import Map from './components/Map';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Map />
      </div>
    </BrowserRouter>
  );
}

export default App;
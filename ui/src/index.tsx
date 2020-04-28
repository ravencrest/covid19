import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter as Router } from 'react-router-dom';
import GlobalContext from './GlobalContext';

ReactDOM.render(
  <Router>
    <GlobalContext />
  </Router>,
  document.getElementById('root')
);

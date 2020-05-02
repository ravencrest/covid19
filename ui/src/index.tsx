import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { HashRouter as Router, Route, Redirect } from 'react-router-dom';
import GlobalContext from './GlobalContext';
import { Switch } from 'react-router';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path='/:dataset'>
          <GlobalContext />
        </Route>
        <Route path='/'>
          <Redirect to={'/global'} />
        </Route>
      </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

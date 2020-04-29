import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import GlobalContext from './GlobalContext';
import { Switch } from 'react-router';

ReactDOM.render(
  <Router>
    <Switch>
      <Route path='/:dataset'>
        <GlobalContext />
      </Route>
      <Route path='/'>
        <Redirect to={'/global'} />
      </Route>
    </Switch>
  </Router>,
  document.getElementById('root')
);

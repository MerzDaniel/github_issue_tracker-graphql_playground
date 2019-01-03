import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  state= {
    path: 'merzdaniel/github_issue-tracker-graphql_playground'
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h2>IssueTracker</h2>
        </header>
      </div>
    );
  }
}

export default App;

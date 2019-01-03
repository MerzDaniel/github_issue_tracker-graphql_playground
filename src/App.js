import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';

const Issue = issue =>
  <div className='issue'>
    <text>({issue.id}) {issue.name}</text>
  </div>


class App extends Component {
  state = {
    path: 'merzdaniel/github_issue-tracker-graphql_playground',
    // issues: [{data: {issues: [{name: 'issue1'}, {name: 'issue2'}] }}],
    issues: [{name: 'I have nothing to do. Everything is working fine', id: 0}, {name: 'PRODUCTION DOWN HELP!', id: 1}]
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h2>IssueTracker</h2>

          <h3>Issues</h3>
          <div className="issue_list">
            {this.state.issues.map(i => Issue(i))}
          </div>
        </header>
      </div>
    );
  }
}

export default App;

import React, {Component, Fragment} from 'react';
import './App.css';
import axios from 'axios'

const githubGraphql = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: 'bearer ' + process.env.REACT_APP_API_TOKEN
  },
})

const GET_ORGANIZATION = `
  {
    repository(login: "merzdaniel") {
      name
      url
      owner {
        login
        ... on User {
          name
        }
        ... on Organization {
          name
        }
      }
    }
  }
`

const Issue = issue =>
  <div className='issue'>
    <text>({issue.id}) {issue.name}</text>
  </div>

const
  issues =
    [{name: 'I have nothing to do. Everything is working fine', id: 0}, {name: 'PRODUCTION DOWN HELP!', id: 1}]

const Repository = repository =>
  <Fragment>
    <h3>{repository.name + `(${repository.url})`}</h3>
    <h4>Issues</h4>
    <div className="issue_list">
      {issues.map(i => Issue(i))}
    </div>
  </Fragment>


class App extends Component {
  state = {
    path: 'merzdaniel/github_issue_tracker-graphql_playground',
    // issues: [{data: {issues: [{name: 'issue1'}, {name: 'issue2'}] }}],
    dataLoaded: false,
  }
  onChange = evt => {
    this.setState({path: evt.target.value})
  }
  onSubmit = evt => {
    this.fetchData()

    evt.preventDefault()
  }

  fetchData = () => {
    githubGraphql
      .post('', {query: GET_ORGANIZATION})
      .then(result => {
        console.log(result)
        this.setState(() => ({
          data: result.data.data,
          errors: result.data.errors,
          dataLoaded: true,
        }))
      })
      .catch(err => console.log(err))
  }

  render() {
    const {path} = this.state
    return (
      <div className="App">
        <header className="App-header">
          <h2>IssueTracker</h2>

          <form onSubmit={this.onSubmit}>
            <label htmlFor="url">
              Show open issues for github {'<user>/<repoName>'}
            </label>
            <input
              id="url"
              type="text"
              value={path}
              onChange={this.onChange}
            />
            <button type="submit">Search</button>
          </form>

          {!this.state.dataLoaded ?
            'Nothing loaded yet' :
            this.state.errors ?
              'errors' :
              <Repository repo={this.state.data.repository}/>
          }

        </header>
      </div>
    );
  }
}

export default App;

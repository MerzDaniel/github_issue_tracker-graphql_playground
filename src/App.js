import React, {Component, Fragment} from 'react';
import './App.css';
import axios from 'axios'

const githubGraphql = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: 'bearer ' + process.env.REACT_APP_API_TOKEN
  },
})

const GET_DATA = (owner, repoName) => `
  {
    repository(owner: "${owner}" name: "${repoName}") {
      id
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
      issues(first: 30) {
        edges {
          node {
            number
            title
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`

const Issue = issue =>
  <div key={issue.number} className='issue'>
    <span>({issue.number}) {issue.title}</span>
  </div>

class Repository extends React.Component {
  onSubmit = evt => {
    evt.preventDefault()
    this.props.createIssue(this.state.issueTitle)
  }
  onChange = evt => {
    this.setState({issueTitle: evt.target.value})
  }

  render() {
    const {repository} = this.props
    return <Fragment>
      <h3>{repository.name + `(${repository.url})`}</h3>
      <h4>Issues</h4>
      {!repository.issues.edges.length ?
        '<no issues>' :
        <div className="issue_list">
          {repository.issues.edges.map(i => Issue(i))}
        </div>
      }
      <form onSubmit={this.onSubmit}>
        <input type="text" name="issueName" onChange={this.onChange} required/>
        <button type={"submit"}>Create Issue</button>
      </form>
    </Fragment>
  }
}

class App extends Component {
  state = {
    path: 'merzdaniel/github_issue_tracker-graphql_playground',
    // issues: [{data: {issues: [{name: 'issue1'}, {name: 'issue2'}] }}],
  }
  onChange = evt => {
    this.setState({path: evt.target.value})
  }
  onSubmit = evt => {
    evt.preventDefault()
    this.fetchData()
  }
  createIssue = title => {
    const repoId = this.state.data.repository.id
    githubGraphql
      .post('', {
        query: `mutation { 
           createissue(input: {
             repositoryId: "${repoId}" 
             title: "${title}"
           }) 
        }`
      })
      .then(response => {
        console.log(response)
        if (response.data.errors) {
          alert(response.data.errors[0])
        }
        this.fetchData()
      })
      .catch(err => {
        console.log(err)
      })
  }

  fetchData = () => {
    const [owner, repoName] = this.state.path.split('/')
    githubGraphql
      .post('', {query: GET_DATA(owner, repoName)})
      .then(result => {
        console.log(result)
        this.setState(() => ({
          data: result.data.data,
          errors: result.data.errors,
        }))
      })
      .catch(err => {
        console.log(err)
        this.setState(() => ({
          data: undefined,
          errors: [err]
        }))
      })
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

          {
            this.state.errors ?
              'errors' :
              !this.state.data ?
                'Nothing loaded yet' :
                <Repository repository={this.state.data.repository} createIssue={this.createIssue}/>
          }

        </header>
      </div>
    );
  }
}

export default App;

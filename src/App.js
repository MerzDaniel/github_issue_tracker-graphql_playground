import React, {Component, Fragment} from 'react';
import './App.css';
import {ApolloClient} from "apollo-client";
import {InMemoryCache} from 'apollo-cache-inmemory'
// http link for sending graphql over http
import {createHttpLink} from "apollo-link-http";
// Apollo needs query to be wrapped by that
import gql from "graphql-tag";

const graphqlClient = new ApolloClient({
  link: createHttpLink({
    uri: 'https://api.github.com/graphql',
    headers: {
      Authorization: 'bearer ' + process.env.REACT_APP_API_TOKEN,
      Accept: 'application/vnd.github.starfire-preview+json',
    },
  }),
  cache: new InMemoryCache(),
})

// Types and commas are required for query variables!
const GET_DATA = gql(`
  query($owner: String!, $repoName: String!){
    repository(owner: $owner name: $repoName) {
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
            id
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`)

const CREATE_ISSUE = gql(`mutation($repoId: ID!, $title: String!) { 
           createIssue(input: {
             repositoryId: $repoId 
             title: $title
           }) {
            issue { title id }
           }
        }`)

const Issue = ({issue}) =>
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
          {repository.issues.edges.map(i => <Issue key={i.node.id} issue={i.node}/>)}
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
    graphqlClient
      .mutate({
        mutation: CREATE_ISSUE,
        variables: {repoId, title},
      })
      .then(response => {
        console.log(response)
        this.fetchData()
      })
      .catch(err => {
        console.log(err)
      })
  }

  fetchData = () => {
    const [owner, repoName] = this.state.path.split('/')
    graphqlClient.query({
      query: GET_DATA,
      variables: { owner, repoName }
    })
      .then(result => {
        console.log(result)
        this.setState(() => ({
          data: result.data,
          errors: undefined,
        }))
      })
      .catch(err => {
        console.log(err)
        this.setState(() => ({
          data: undefined,
          errors: [err],
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

import React, {Component, Fragment} from 'react';
import './App.css';
import {ApolloClient} from "apollo-client";
import {InMemoryCache} from 'apollo-cache-inmemory'
// http link for sending graphql over http
import {createHttpLink} from "apollo-link-http";
// Apollo needs query to be wrapped by that
import gql from "graphql-tag";
import {Query, ApolloProvider, Mutation} from 'react-apollo'

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
const GET_DATA = gql`
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
`

const CREATE_ISSUE = gql`mutation($repoId: ID!, $title: String!) { 
           createIssue(input: {
             repositoryId: $repoId 
             title: $title
           }) {
            issue { title id }
           }
        }`

const Issue = ({issue}) =>
  <div key={issue.number} className='issue'>
    <span>({issue.number}) {issue.title}</span>
  </div>

class Repository extends React.Component {
  onChange = evt => {
    this.setState({issueTitle: evt.target.value})
  }

  render() {
    const {repository} = this.props
    const updateCache = (cacheProxy, mutationResult) => {
      const {data: {createIssue: {issue}}} = mutationResult
      const variables = {owner: repository.owner.login, repoName: repository.name}
      const dataUpdate = cacheProxy.readQuery({
        query: GET_DATA, variables
      })
      dataUpdate.repository.issues.edges.push(issue)
      cacheProxy.writeQuery({query: GET_DATA, variables, data: dataUpdate})
      cacheProxy.writeData({})
    }

    return <Fragment>
      <h3>{repository.name + `(${repository.url})`}</h3>
      <h4>Issues</h4>
      {!repository.issues.edges.length ?
        '<no issues>' :
        <div className="issue_list">
          {repository.issues.edges.map(i => <Issue key={i.node.id} issue={i.node}/>)}
        </div>
      }
      <Mutation mutation={CREATE_ISSUE} update={updateCache}>
        {(mutate) =>
          <form onSubmit={(evt) => {
            evt.preventDefault();
            mutate({variables: {repoId: repository.id, title: this.state.issueTitle}});
          }}>
            <input type="text" name="issueName" onChange={this.onChange} required/>
            <button type={"submit"}>Create Issue</button>
          </form>
        }
      </Mutation>
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

  render() {
    const {path} = this.state
    const [owner, repoName] = path.split('/')
    return (
      <ApolloProvider client={graphqlClient}>
        <div className="App">
          <header className="App-header">
            <h2>IssueTracker</h2>

            <label htmlFor="url">
              Show open issues for github {'<user>/<repoName>'}
            </label>
            <input
              id="url"
              type="text"
              value={path}
              onChange={this.onChange}
            />

            {/*ErrorPolicy is needed because of a react-apollo bug which does not update the children correctly*/}
            <Query query={GET_DATA} variables={{owner, repoName}} errorPolicy="ignore" onCompleted={(data) => {
              const realPath = `${data.repository.owner.login}/${data.repository.name}`
              if (this.state.path !== realPath)
                this.setState({path: realPath})
            }}>
              {({data, loading, error}) => {
                if (loading || error || !data.repository)
                  return loading ? 'Loading....' :
                    // error ? 'Repository could not be found' :
                    error && error.type === 'NOT_FOUND' ? 'Repository could not be found.' :
                      error ? console.log(error) || console.log('#### data: ') || console.log(data) || 'Error occured: ' + error :
                        'Repo was found but no data was returned...'

                return <Repository repository={data.repository}/>
              }}
            </Query>
          </header>
        </div>
      </ApolloProvider>
    )
      ;
  }
}

export default App;

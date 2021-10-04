import { ApolloClient, from } from '@apollo/client';
import { onError } from 'apollo-link-error';
import { ApolloLink, Observable } from 'apollo-link';
import getToken from "./getNewToken";
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from "apollo-link-http";

const cache = new InMemoryCache();

// Define Http link
const httpLink = new HttpLink({
    uri: 'http://localhost:5001/graphql',
    credentials: 'include',
   
  });

const authLink = new ApolloLink((operation, forward) => {
    const accessToken = localStorage.getItem('accessToken');
    const context = operation.getContext();
    //const authHeader = context.response.headers.get("Authorization");
    operation.setContext({
        headers: {
           // ...authHeader,
          authorization: `Bearer ${accessToken}`,
        },
      })
    
      return forward(operation)
});

 
const link =  ApolloLink.from([
      onError(({ graphQLErrors, networkError, operation, forward }) => {
          
        // User access token has expired
        if (graphQLErrors && graphQLErrors[0].message === 'INVALIDTOKEN') {
          // We assume we have both tokens needed to run the async request
            // Let's refresh token through async request
            return new Observable(observer => {
                getToken()
                .then(refreshResponse => {
                    window.localStorage.setItem('accessToken', refreshResponse); // save sessionID, e.g. in a cookie
                    const context = operation.getContext();
                    const authHeader = context.response.headers.get("Authorization");
                    operation.setContext({
                        headers: {
                            ...authHeader,
                          authorization: `Bearer ${refreshResponse}`,
                        },
                      })
                })
                .then(() => {
                  const subscriber = {
                    next: observer.next.bind(observer),
                    error: observer.error.bind(observer),
                    complete: observer.complete.bind(observer)
                  };
  
                  // Retry last failed request
                  forward(operation).subscribe(subscriber);
                })
                .catch(error => {
                  // No refresh or client token available, we force user to login
                  observer.error(error);
                });
            });
          
        }
      })
    ]);

const client = new ApolloClient({
    link: from([authLink, link, httpLink]),
    cache
});

export default client;
import {  ApolloClient, concat, createNetworkInterface } from '@apollo/react-hooks';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, Operation, NextLink, Observable, fromPromise,  } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import Cookies from 'js-cookie';
import { GraphQLError } from 'graphql';
import { onError } from "apollo-link-error";
import getToken from "./getNewToken";

const cache = new InMemoryCache();

const afterwareLink = new ApolloLink((operation, forward) => {
  forward(operation).map(response => {
    const context = operation.getContext();
    const authHeader = context.response.headers.get("Authorization");

    // We would see this log in the SSR logs in the terminal
    // but in the browser console it would always be null!
    

    if (authHeader) {
      // cut off the 'Bearer ' part from the header
      const SESSION_ID = authHeader.replace("Bearer ", "");

      window.localStorage.setItem('accessToken', SESSION_ID); // save sessionID, e.g. in a cookie
    }

    return response;
  });

  //console.log(JSON.parse(Cookies.get('rfsrt')))
  return forward(operation);

  
});

const errorLink = onError( ({graphQLErrors, networkError, operation, forward}) => {
  if(graphQLErrors) {
    for (let err in graphQLErrors) {
     switch (graphQLErrors[err].message) {
       case "NOTOKEN":
         return fromPromise(
           getToken().catch((err) => {return})
         ).filter((value) =>  Boolean(value))
          .flatMap((accessToken) => {
            
            const oldHeaders = operation.getContext().headers;
            // modify the operation context with a new token
            operation.setContext({
              headers: {
                ...oldHeaders,
                authorization: `Bearer ${accessToken}`,
              },
            });

            return forward(operation);
          });
       case "INVALIDTOKEN": 
        return fromPromise(
          getToken().catch((err) => {return})
        ).filter((value) =>  Boolean(value))
        .flatMap((accessToken) => {
          
          const oldHeaders = operation.getContext().headers;
          // modify the operation context with a new token
          console.log(operation)
          operation.setContext({
            headers: {
              ...oldHeaders,
              authorization: `Bearer ${accessToken.data.Refresh.accessToken}`,
            },
          });

          return forward(operation);
        });
     }
    }
  }
});

const token = localStorage.getItem('accessToken') || null;

const httpLink = new HttpLink({
  uri: "http://localhost:5001/graphql",
  headers: token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {},
    credentials: 'include',
    
});


const client = new ApolloClient({
  link:  concat(errorLink, afterwareLink.concat(httpLink)),
  cache
  
});
//afterwareLink.concat(httpLink)
export default client;

/**headers: {
      authorization: "rfsrt " + JSON.parse(Cookies.get('rfsrt')) || null
    } */
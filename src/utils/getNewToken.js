import client from './GQLClient';
import gql from 'graphql-tag';

const getToken = async() => {
    const GET_TOKEN = gql`
    mutation {
        Refresh{
          name
          accessToken
        }
      }`;

    return await client.mutate({
        mutation: GET_TOKEN
    }).then(res => {return res.data.Refresh.accessToken})
};

export default getToken;
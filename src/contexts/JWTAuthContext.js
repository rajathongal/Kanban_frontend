import React, {
  createContext,
  useEffect,
  useReducer
} from 'react';
import jwtDecode from 'jwt-decode';
import SplashScreen from 'src/components/SplashScreen';
//import axios from 'src/utils/axios';
import gql from 'graphql-tag';
import client from '../utils/GQLClient';
import axios from 'axios';
import Cookies from 'js-cookie';

const initialAuthState = {
  isAuthenticated: false,
  isInitialised: false,
  user: null
};

const isValidToken = (accessToken) => {
  if (!accessToken) {
    return false;
  }

 // const decoded = jwtDecode(accessToken);
  //const currentTime = Date.now() / 1000;

  //return decoded.exp > currentTime;
  return true;
};

const setSession = (accessToken) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    localStorage.removeItem('accessToken');
    Cookies.remove('rfsrt')
    delete axios.defaults.headers.common.Authorization;
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'INITIALISE': {
      const { isAuthenticated, user, userImage } = action.payload;

      return {
        ...state,
        isAuthenticated,
        isInitialised: true,
        user, userImage 
      };
    }
    case 'LOGIN': {
      const { user, userImage } = action.payload;

      return {
        ...state,
        isAuthenticated: true,
        user,
        userImage
      };
    }
    case 'LOGOUT': {
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userImage: null
      };
    }
    case 'REGISTER': {
      const { user } = action.payload;

      return {
        ...state,
        isAuthenticated: true,
        user
      };
    }
    default: {
      return { ...state };
    }
  }
};

const AuthContext = createContext({
  ...initialAuthState,
  method: 'JWT',
  login: () => Promise.resolve(),
  logout: () => { },
  register: () => Promise.resolve()
});

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialAuthState);
  

  const login = async (email, password) => {
    const SIGN_IN = gql`
    mutation($email:String!, $password: String!){
      signInUser(email: $email, password: $password){
        accessToken
        name
        rfsrt
        email
      }
    }
    `;

    const {data} = await client.mutate({
      mutation: SIGN_IN,
      variables: {email,password}
    }).then(res => {return res})

    setSession(data.signInUser.accessToken)
    //window.localStorage.setItem('rfsrt', data.signInUser.rfsrt);
    await Cookies.set('rfsrt', data.signInUser.rfsrt);
    

    const options = {
      withCredentials: true,
      data: {
        email: data.signInUser.email
      }
    }

    await axios.post('http://localhost:5001/UserImageFetch', {options}).then((res) => {

      dispatch({
        type: 'LOGIN',
        payload: {
          user: data.signInUser,
          userImage: res
        }
      });
    });
  };



  const logout = () => {
    setSession(null);
    dispatch({ type: 'LOGOUT' });
  };

  const register = async (email, name, password) => {
    const SIGNUP = gql`
    mutation SignUpUser($name: String!, $email: String!, $password: String!){
      signUpUser(name: $name, email: $email, password: $password){
        _id
        name
        email
        accessToken
        rfsrt
      }
    }    
    `;

    const {data} = await client.mutate({
      mutation: SIGNUP,
      variables: {name,email,password}
    }).then(res => {return res})

    // setSession(data.signUpUser.accessToken)
    // window.localStorage.setItem('rfsrt', data.signUpUser.rfsrt);

    dispatch({
      type: 'REGISTER',
      payload: {
        user: data.signUpUser
      }
    });
  };

  useEffect(() => {
    const initialise = async () => {
      try {
        const accessToken = window.localStorage.getItem('accessToken');
        if (accessToken && isValidToken(accessToken)) {
          setSession(accessToken);
          
          const INIT = gql`
          mutation {
            ContiniousAuthVerify {
              name
              _id
              email
            }
          }`;

          const {data} = await client.mutate({
            mutation: INIT,
          }).then(res => {return res})
          
          console.log(data)
          const options = {
            withCredentials: true,
            data: {
              email: data.ContiniousAuthVerify.email
            }
          }

          await axios.post('http://localhost:5001/UserImageFetch', {options}).then((res) => {

            dispatch({
              type: 'INITIALISE',
              payload: {
                isAuthenticated: true,
                user: data.ContiniousAuthVerify, 
                userImage: res
              }
            });
          });

          

        } else {
          dispatch({
            type: 'INITIALISE',
            payload: {
              isAuthenticated: false,
              user: null
            }
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: 'INITIALISE',
          payload: {
            isAuthenticated: false,
            user: null
          }
        });
      }
    };

    initialise();
  }, []);

  if (!state.isInitialised) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'JWT',
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
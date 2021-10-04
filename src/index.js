import 'prismjs/prism';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'nprogress/nprogress.css';
import 'src/__mocks__';
import 'src/assets/css/prism.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { enableES5 } from 'immer';
import * as serviceWorker from 'src/serviceWorker';
import store from 'src/store';
import { SettingsProvider } from 'src/contexts/SettingsContext';
import { ApolloProvider } from '@apollo/react-hooks';
import client from './utils/GQLClient';
import App from 'src/App';

enableES5();

ReactDOM.render(
  <ApolloProvider client={client}> 
    <Provider store={store}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </Provider>
  </ApolloProvider>,
  document.getElementById('root')
);

serviceWorker.register();

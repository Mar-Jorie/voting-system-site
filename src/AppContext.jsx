import { createContext } from 'react';

const AppContext = createContext({
  user: null,
  setUser: () => {},
  schemas: [],
  setSchemas: () => {},
  logout: () => {},
  login: () => {},
});

export { AppContext };

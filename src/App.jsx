// App.jsx
import React from 'react';
import { useRoutes } from 'react-router-dom';
import { Home } from './pages/Home';
import Settings from './pages/Settings';

const App = () => {
  return useRoutes([
    {
      path: '/',
      element: <Home />,
      errorElement: <h1>Not Found</h1>,
    },
    {
      path: '/settings',
      element: <Settings />,
    },
  ]);
};

export default App;

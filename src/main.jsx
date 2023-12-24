// index.jsx
import { render } from 'preact';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';
import { HashRouter,Routes,Route } from 'react-router-dom';
import App from './App';

render(
  <HashRouter basename="/">
    <App />
  </HashRouter>,
  document.getElementById('app')
);

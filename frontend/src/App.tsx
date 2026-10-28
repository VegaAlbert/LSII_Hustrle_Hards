import { useState } from 'react';
import './App.css';
import { useAllVideos } from './useAllVideos';
import { AuthProvider } from './auth/AuthProvider';
import NavBar from './components/NavBar';
import LoginPage from './components/LoginPage';

// No router yet: the current page is kept in state
type Page = 'home' | 'login';

function App() {
  const [page, setPage] = useState<Page>('home');
  const goHome = () => setPage('home');

  return (
    <AuthProvider>
      <div className="App">
        <NavBar onHome={goHome} onLogin={() => setPage('login')} showLogin={page !== 'login'} />
        {page === 'login' ? (
          <LoginPage onSuccess={goHome} />
        ) : (
          <header className="App-header">
            <img src="/protube-logo-removebg-preview.png" className="App-logo" alt="logo" />
            <ContentApp />
          </header>
        )}
      </div>
    </AuthProvider>
  );
}

function ContentApp() {
  const { loading, message, value } = useAllVideos();
  switch (loading) {
    case 'loading':
      return <div>Loading...</div>;
    case 'error':
      return (
        <div>
          <h3>Error</h3> <p>{message}</p>
        </div>
      );
    case 'success':
      return (
        <>
          <strong>Videos availables:</strong>
          <ul>
            {value.map((item) => (
              <li>{item}</li>
            ))}
          </ul>
        </>
      );
  }
  return <div>Idle...</div>;
}

export default App;

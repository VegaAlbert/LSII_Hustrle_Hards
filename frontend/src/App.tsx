import { useState } from 'react';
import './App.css';
import { AuthProvider } from './auth/AuthProvider';
import NavBar from './components/NavBar';
import LoginPage from './components/LoginPage';
import VideoGrid from './components/VideoGrid';

// No router yet: the current page is kept in state
type Page = 'home' | 'login';

function App() {
  const [page, setPage] = useState<Page>('home');
  const goHome = () => setPage('home');

  return (
    <AuthProvider>
      <div className="App">
        <NavBar onHome={goHome} onLogin={() => setPage('login')} />
        {page === 'login' ? (
          <LoginPage onSuccess={goHome} />
        ) : (
          <main className="container py-4">
            <VideoGrid />
          </main>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;

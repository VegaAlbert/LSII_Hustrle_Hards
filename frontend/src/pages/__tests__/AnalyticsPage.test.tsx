import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AnalyticsPage from '../AnalyticsPage';
import { AuthContext, type AuthContextValue } from '../../auth/authContext';
import { fetchMyAnalytics, type Analytics } from '../../analytics/analyticsApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../analytics/analyticsApi', () => ({
  ...jest.requireActual('../../analytics/analyticsApi'),
  fetchMyAnalytics: jest.fn(),
}));
const mockedFetchMyAnalytics = fetchMyAnalytics as jest.MockedFunction<typeof fetchMyAnalytics>;

const alice = { id: 1, username: 'alice', email: 'alice@example.com' };

// 30 days of the chart: no views except 3 on the first day and 1 today
const dailyViews = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 9, 19 + index)).toISOString().slice(0, 10),
  views: index === 0 ? 3 : index === 29 ? 1 : 0,
}));

const analytics: Analytics = {
  totalVideos: 2,
  totalViews: 1234,
  authenticatedViews: 434,
  anonymousViews: 800,
  totalComments: 5,
  totalCommentLikes: 12,
  videos: [
    {
      id: 8,
      title: 'Autumn in Girona',
      thumbnailUrl: '/media/upload-2-thumbnail.jpg',
      publishedAt: '2026-11-10T10:00:00Z',
      views: 1000,
      authenticatedViews: 400,
      anonymousViews: 600,
      comments: 5,
      commentLikes: 12,
    },
    {
      id: 7,
      title: 'Summer in Girona',
      thumbnailUrl: '/media/upload-1-thumbnail.jpg',
      publishedAt: '2026-08-01T10:00:00Z',
      views: 234,
      authenticatedViews: 34,
      anonymousViews: 200,
      comments: 0,
      commentLikes: 0,
    },
  ],
  dailyViews,
};

const empty: Analytics = {
  totalVideos: 0,
  totalViews: 0,
  authenticatedViews: 0,
  anonymousViews: 0,
  totalComments: 0,
  totalCommentLikes: 0,
  videos: [],
  dailyViews: [],
};

const apiError = (status: number) =>
  new AxiosError('error', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });

const CurrentPath = () => <p>Page {useLocation().pathname}</p>;

const renderPage = (user: AuthContextValue['user'] = alice) =>
  render(
    <I18nProvider>
      <AuthContext.Provider
        value={{
          user,
          login: jest.fn(),
          register: jest.fn(),
          loginWithGoogle: jest.fn(),
          logout: jest.fn(),
          updateSession: jest.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/analytics']}>
          <Routes>
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<CurrentPath />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </I18nProvider>
  );

describe('AnalyticsPage', () => {
  beforeEach(() => {
    mockedFetchMyAnalytics.mockReset();
  });

  it('sends visitors who are not logged in to the login page', () => {
    renderPage(null);

    expect(screen.getByText('Page /login')).toBeInTheDocument();
    expect(mockedFetchMyAnalytics).not.toHaveBeenCalled();
  });

  it('shows a loading message while the analytics are requested', () => {
    mockedFetchMyAnalytics.mockReturnValueOnce(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading analytics...');
  });

  it('shows the totals of my videos', async () => {
    mockedFetchMyAnalytics.mockResolvedValueOnce(analytics);

    renderPage();

    const totals = await screen.findByRole('list', { name: 'Totals' });
    const cards = within(totals).getAllByRole('listitem');
    expect(cards.map((card) => card.textContent)).toEqual([
      'Videos2',
      'Total views1,234',
      'Comments5',
      'Comment likes12',
    ]);
  });

  it('splits the views between authenticated and anonymous users', async () => {
    mockedFetchMyAnalytics.mockResolvedValueOnce(analytics);

    renderPage();

    const audience = await screen.findByRole('region', { name: 'Audience' });
    expect(within(audience).getByText('Authenticated users').nextSibling).toHaveTextContent('434');
    expect(within(audience).getByText('Anonymous users').nextSibling).toHaveTextContent('800');
    expect(within(audience).getByText('Authenticated: 35.2% · Anonymous: 64.8%')).toBeInTheDocument();
  });

  it('draws the views of each of the last 30 days', async () => {
    mockedFetchMyAnalytics.mockResolvedValueOnce(analytics);

    renderPage();

    const chart = await screen.findByRole('region', { name: 'Views in the last 30 days' });
    expect(within(chart).getAllByRole('listitem')).toHaveLength(30);
    expect(within(chart).getByText('19 Oct: 3 views')).toBeInTheDocument();
    expect(within(chart).getByText('17 Nov: 1 view')).toBeInTheDocument();
  });

  it('lists each of my videos with its counters and a link to it', async () => {
    mockedFetchMyAnalytics.mockResolvedValueOnce(analytics);

    renderPage();

    const rows = within(await screen.findByRole('table')).getAllByRole('row');
    // Header and one row per video, newest first
    expect(rows).toHaveLength(3);
    const cells = within(rows[1])
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    expect(cells).toEqual(['Autumn in Girona', '10 Nov 2026', '1,000', '5', '12']);
    expect(within(rows[2]).getByRole('link', { name: 'Summer in Girona' })).toHaveAttribute('href', '/videos/7');
  });

  it('shows an empty state with a link to upload a video when I have no videos', async () => {
    const user = userEvent.setup();
    mockedFetchMyAnalytics.mockResolvedValueOnce(empty);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'No analytics yet' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Totals' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Upload a video' }));
    expect(screen.getByText('Page /upload')).toBeInTheDocument();
  });

  it('says nobody has watched my videos when they have no views yet', async () => {
    mockedFetchMyAnalytics.mockResolvedValueOnce({
      ...analytics,
      totalViews: 0,
      authenticatedViews: 0,
      anonymousViews: 0,
    });

    renderPage();

    expect(await screen.findByText('Nobody has watched your videos yet.')).toBeInTheDocument();
  });

  it('shows an error that can be retried', async () => {
    const user = userEvent.setup();
    mockedFetchMyAnalytics.mockRejectedValueOnce(apiError(500)).mockResolvedValueOnce(analytics);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your analytics.');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('list', { name: 'Totals' })).toBeInTheDocument();
    expect(mockedFetchMyAnalytics).toHaveBeenCalledTimes(2);
  });

  it('asks to log in again when the session has expired', async () => {
    mockedFetchMyAnalytics.mockRejectedValueOnce(apiError(401));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Your session has expired.');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });
  describe('in other languages', () => {
    afterEach(() => localStorage.clear());

    it('shows the dashboard in Spanish with Spanish numbers and dates', async () => {
      localStorage.setItem('protube.language', 'es');
      mockedFetchMyAnalytics.mockResolvedValueOnce(analytics);

      renderPage();

      const totals = await screen.findByRole('list', { name: 'Totales' });
      expect(within(totals).getByText('Visualizaciones totales').nextSibling).toHaveTextContent('1234');
      expect(screen.getByRole('heading', { name: 'Estadísticas' })).toBeInTheDocument();
      expect(screen.getByText('Registrados: 35,2 % · Anónimos: 64,8 %')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Visualizaciones de los últimos 30 días' })).toBeInTheDocument();
      expect(screen.getByText('17 nov: 1 visualización')).toBeInTheDocument();
    });

    it('shows the empty state in Catalan', async () => {
      localStorage.setItem('protube.language', 'ca');
      mockedFetchMyAnalytics.mockResolvedValueOnce(empty);

      renderPage();

      expect(await screen.findByRole('heading', { name: 'Encara no hi ha estadístiques' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Penja un vídeo' })).toHaveAttribute('href', '/upload');
    });
  });
});

import { render, screen } from '@testing-library/react';
import SubscriberCount from '../SubscriberCount';
import { fetchSubscriberCount } from '../../subscriptions/subscriptionsApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../subscriptions/subscriptionsApi');
const mockedFetchSubscriberCount = fetchSubscriberCount as jest.MockedFunction<typeof fetchSubscriberCount>;

describe('SubscriberCount', () => {
  beforeEach(() => mockedFetchSubscriberCount.mockReset());

  it('shows the number of subscribers of the user', async () => {
    mockedFetchSubscriberCount.mockResolvedValueOnce(1234);
    render(<SubscriberCount />);

    const stat = screen.getByRole('region', { name: 'Subscribers' });
    expect(stat).toHaveTextContent('Loading...');
    expect(await screen.findByText('1,234')).toBeInTheDocument();
  });

  it('says it is not available when the count cannot be read', async () => {
    mockedFetchSubscriberCount.mockRejectedValueOnce(new Error('Network error'));
    render(<SubscriberCount />);

    expect(await screen.findByText('Not available')).toBeInTheDocument();
  });

  it('formats the number for the language of the user', async () => {
    localStorage.setItem('protube.language', 'es');
    mockedFetchSubscriberCount.mockResolvedValueOnce(12345);
    render(
      <I18nProvider>
        <SubscriberCount />
      </I18nProvider>
    );

    expect(screen.getByRole('region', { name: 'Suscriptores' })).toHaveTextContent('Cargando...');
    expect(await screen.findByText('12.345')).toBeInTheDocument();
    localStorage.clear();
  });
});

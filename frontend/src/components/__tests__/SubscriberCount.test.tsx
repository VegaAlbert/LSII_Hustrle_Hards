import { render, screen } from '@testing-library/react';
import SubscriberCount from '../SubscriberCount';
import { fetchSubscriberCount } from '../../subscriptions/subscriptionsApi';
import { I18nProvider } from '../../i18n/I18nProvider';

jest.mock('../../subscriptions/subscriptionsApi');
const mockedFetchSubscriberCount = fetchSubscriberCount as jest.MockedFunction<typeof fetchSubscriberCount>;

// It is a card of the totals list of the Analytics page
const renderCard = () =>
  render(
    <ul aria-label="Totals">
      <SubscriberCount />
    </ul>
  );

describe('SubscriberCount', () => {
  beforeEach(() => mockedFetchSubscriberCount.mockReset());

  it('shows the number of subscribers of the user', async () => {
    mockedFetchSubscriberCount.mockResolvedValueOnce(1234);
    renderCard();

    expect(screen.getByRole('listitem')).toHaveTextContent('SubscribersLoading...');
    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('Subscribers1,234');
  });

  it('says it is not available when the count cannot be read', async () => {
    mockedFetchSubscriberCount.mockRejectedValueOnce(new Error('Network error'));
    renderCard();

    expect(await screen.findByText('Not available')).toBeInTheDocument();
  });

  it('formats the number for the language of the user', async () => {
    localStorage.setItem('protube.language', 'es');
    mockedFetchSubscriberCount.mockResolvedValueOnce(12345);
    render(
      <I18nProvider>
        <ul aria-label="Totals">
          <SubscriberCount />
        </ul>
      </I18nProvider>
    );

    expect(screen.getByRole('listitem')).toHaveTextContent('SuscriptoresCargando...');
    expect(await screen.findByText('12.345')).toBeInTheDocument();
    localStorage.clear();
  });
});

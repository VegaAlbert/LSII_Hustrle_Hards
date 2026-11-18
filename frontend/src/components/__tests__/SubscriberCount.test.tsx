import { render, screen } from '@testing-library/react';
import SubscriberCount from '../SubscriberCount';
import { fetchSubscriberCount } from '../../subscriptions/subscriptionsApi';

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

    expect(screen.getByRole('listitem')).toHaveTextContent('Subscribers…');
    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('Subscribers1,234');
  });

  it('says it is not available when the count cannot be read', async () => {
    mockedFetchSubscriberCount.mockRejectedValueOnce(new Error('Network error'));
    renderCard();

    expect(await screen.findByText('Not available')).toBeInTheDocument();
  });
});

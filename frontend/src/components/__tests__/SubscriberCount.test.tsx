import { render, screen } from '@testing-library/react';
import SubscriberCount from '../SubscriberCount';
import { fetchSubscriberCount } from '../../subscriptions/subscriptionsApi';

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
});

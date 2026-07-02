import { HandleSubscriptionDeletedUseCase } from './handle-subscription-deleted.use-case';
import type { SubscriptionRepository } from '../ports/subscription.repository';

function makeUseCase() {
  const repo = {
    cancelByCustomerId: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SubscriptionRepository>;
  return { uc: new HandleSubscriptionDeletedUseCase(repo), repo };
}

describe('HandleSubscriptionDeletedUseCase', () => {
  it('cancels by customer id when customer is a string', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ customer: 'cus_1' });
    expect(repo.cancelByCustomerId).toHaveBeenCalledWith('cus_1');
  });

  it('cancels by customer id when customer is an object', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ customer: { id: 'cus_2' } });
    expect(repo.cancelByCustomerId).toHaveBeenCalledWith('cus_2');
  });

  it('is a no-op on a malformed payload', async () => {
    const { uc, repo } = makeUseCase();
    await uc.execute({ nope: true });
    expect(repo.cancelByCustomerId).not.toHaveBeenCalled();
  });
});

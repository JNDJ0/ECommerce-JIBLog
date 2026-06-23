import OwnerService from '../../../src/domains/Owner/services/OwnerService';
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
  user:  { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  owner: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  product: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
};

describe('OwnerService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar User com role owner e Owner vinculado na mesma operação', async () => {
    const fakeUser  = { id: 1, email: 'owner@test.com', name: 'Owner', password: 'hash', address: 12345678, role: 'owner', ownerId: null };
    const fakeOwner = { id: 5, userId: 1 };

    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(fakeUser);
    prismaMock.owner.create.mockResolvedValue(fakeOwner);
    prismaMock.user.update.mockResolvedValue({ ...fakeUser, ownerId: fakeOwner.id });

    const body = { email: 'owner@test.com', name: 'Owner', password: '123456', address: 12345678 } as any;
    const result = await OwnerService.create(body);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'owner' }) })
    );
    expect(prismaMock.owner.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: fakeUser.id } })
    );
    expect(result).toEqual(fakeOwner);
  });
});
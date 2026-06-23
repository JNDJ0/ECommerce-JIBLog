import OwnerService from '../../../src/domains/Owner/services/OwnerService';
import { QueryError } from '../../../errors/QueryError';
import prisma from '../../../config/client';
import * as bcrypt from 'bcrypt';

const prismaMock = prisma as unknown as {
  user:  { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  owner: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  product: { deleteMany: jest.Mock; findMany: jest.Mock };
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

describe('OwnerService.findByEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar QueryError quando o usuário não existe', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(OwnerService.findByEmail('naoexiste@test.com')).rejects.toThrow(QueryError);
    await expect(OwnerService.findByEmail('naoexiste@test.com')).rejects.toThrow('Proprietário não encontrado.');
  });
});

describe('OwnerService.updateOwner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve hashear a senha com bcrypt antes de salvar', async () => {
    const updatedUser = { id: 1, email: 'owner@test.com', name: 'Owner', password: 'HASHED', address: 12345678, role: 'owner' };
    prismaMock.user.update.mockResolvedValue(updatedUser);

    const body = { email: 'owner@test.com', name: 'Owner', password: 'senhaPlana', address: 12345678 } as any;
    await OwnerService.updateOwner('owner@test.com', body);

    const callData = prismaMock.user.update.mock.calls[0][0].data;

    expect(callData.password).not.toBe('senhaPlana');
    const isValid = await bcrypt.compare('senhaPlana', callData.password);
    expect(isValid).toBe(true);
  });
});

describe('OwnerService.deleteOwner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve deletar produtos usando owner.id e não user.id', async () => {
    const fakeUser  = { id: 99, email: 'owner@test.com', name: 'Owner', role: 'owner' };
    const fakeOwner = { id: 7, userId: 99 };   

    prismaMock.user.findFirst.mockResolvedValue(fakeUser);
    prismaMock.owner.findFirst.mockResolvedValue(fakeOwner);
    prismaMock.$transaction.mockResolvedValue([{}, {}, {}]);

    await OwnerService.deleteOwner('owner@test.com');

    const transactionCalls = prismaMock.$transaction.mock.calls[0][0];

    expect(prismaMock.product.deleteMany).toHaveBeenCalledWith({
      where: { ownerId: fakeOwner.id },
    });
  });
});

describe('OwnerService.findProductsByOwner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar os produtos do owner pelo userId', async () => {
    const fakeOwner    = { id: 7, userId: 1 };
    const fakeProducts = [
      { id: 1, name: 'Produto A', price: 10, quantity: 5, ownerId: 7 },
      { id: 2, name: 'Produto B', price: 20, quantity: 3, ownerId: 7 },
    ];

    prismaMock.owner.findFirst.mockResolvedValue(fakeOwner);
    prismaMock.product.findMany.mockResolvedValue(fakeProducts);

    const result = await OwnerService.findProductsByOwner(1);

    expect(result).toEqual(fakeProducts);
    expect(prismaMock.owner.findFirst).toHaveBeenCalledWith({ where: { userId: 1 } });
    expect(prismaMock.product.findMany).toHaveBeenCalledWith({ where: { ownerId: fakeOwner.id } });
  });
});
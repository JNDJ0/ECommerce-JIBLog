import UserService from '../../../src/domains/User/services/UserService';
import { QueryError } from '../../../errors/QueryError'
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
  user: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
};

describe('UserService.create — email duplicado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar QueryError quando o email já está cadastrado', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 1,
      email: 'existente@test.com',
      name: 'Existente',
      password: 'hash',
      address: 12345678,
      role: 'user',
    });

    const body = {
      email: 'existente@test.com',
      name: 'Novo',
      password: '123456',
      address: 12345678,
    } as any;

    await expect(UserService.create(body)).rejects.toThrow(QueryError);
    await expect(UserService.create(body)).rejects.toThrow('Esse email já está cadastrado.');
  });
});
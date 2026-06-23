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

describe('UserService.create — CEP inválido', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar InvalidParamError quando o CEP tem formato inválido', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null); // email livre

    const body = {
      email: 'novo@test.com',
      name: 'Novo',
      password: '123456',
      address: 1234,   // CEP inválido: menos de 8 dígitos
    } as any;

    await expect(UserService.create(body)).rejects.toThrow(InvalidParamError);
    await expect(UserService.create(body)).rejects.toThrow('Esse CEP não é válido.');
  });
});

describe('UserService.findByEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar o usuário quando o email existe', async () => {
    const fakeUser = { id: 1, email: 'teste@test.com', name: 'Teste', password: 'hash', address: 12345678, role: 'user' };
    prismaMock.user.findFirst.mockResolvedValue(fakeUser);

    const result = await UserService.findByEmail('teste@test.com');

    expect(result).toEqual(fakeUser);
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { email: 'teste@test.com' },
    });
  });

  it('deve retornar null quando o email não está cadastrado', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const result = await UserService.findByEmail('naoexiste@test.com');

    expect(result).toBeNull();
  });
});
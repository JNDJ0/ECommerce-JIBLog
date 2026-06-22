import DelivererService from '../../../src/domains/Deliverer/services/DelivererService';
import { QueryError } from '../../../errors/QueryError';
import { InvalidParamError } from '../../../errors/InvalidParamError';
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
    deliverer: { findFirst: jest.Mock; create: jest.Mock; delete: jest.Mock };
    user:      { findFirst: jest.Mock; create: jest.Mock; delete: jest.Mock };
    $transaction: jest.Mock;
};

describe('DelivererService.create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve lançar QueryError quando o email já está cadastrado', async () => {
        prismaMock.user.findFirst.mockResolvedValue({ id: 1, email: 'dup@test.com' });

        const body = { email: 'dup@test.com', name: 'Dup', password: '123456', address: 12345678, region: 'Sul' };

        await expect(DelivererService.create(body as any)).rejects.toThrow(QueryError);
        await expect(DelivererService.create(body as any)).rejects.toThrow('Esse email já está cadastrado.');
    });

    it('deve lançar InvalidParamError quando a região está vazia', async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);

        const body = { email: 'novo@test.com', name: 'Novo', password: '123456', address: 12345678, region: '   ' };

        await expect(DelivererService.create(body as any)).rejects.toThrow(InvalidParamError);
        await expect(DelivererService.create(body as any)).rejects.toThrow('Região de atuação é obrigatória.');
    });
});

describe('DelivererService.delete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve lançar QueryError quando o entregador não existe', async () => {
        prismaMock.deliverer.findFirst.mockResolvedValue(null);

        await expect(DelivererService.delete(99)).rejects.toThrow(QueryError);
        await expect(DelivererService.delete(99)).rejects.toThrow('Entregador não encontrado.');
    });

    it('deve deletar o entregador e o usuário com sucesso', async () => {
        const deliverer = { id: 5, userId: 1, region: 'Sul' };
        prismaMock.deliverer.findFirst.mockResolvedValue(deliverer);
        prismaMock.$transaction.mockResolvedValue([{}, {}]);

        await DelivererService.delete(1);

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        expect(prismaMock.deliverer.delete).toHaveBeenCalledWith({ where: { id: deliverer.id } });
        expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});

describe('DelivererService.updateRegion', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve lançar InvalidParamError quando a região está vazia', async () => {
        await expect(DelivererService.updateRegion(1, '   ')).rejects.toThrow(InvalidParamError);
        await expect(DelivererService.updateRegion(1, '')).rejects.toThrow('Região não pode ser vazia.');
    });

    it('deve atualizar a região com sucesso', async () => {
        const deliverer = { id: 3, userId: 1, region: 'Sul' };
        prismaMock.deliverer.findFirst.mockResolvedValue(deliverer);
        prismaMock.deliverer.update  = jest.fn().mockResolvedValue({ ...deliverer, region: 'Norte' });

        const result = await DelivererService.updateRegion(1, 'Norte');

        expect(prismaMock.deliverer.findFirst).toHaveBeenCalledWith({ where: { userId: 1 } });
        expect(prismaMock.deliverer.update).toHaveBeenCalledWith({
            where: { id: deliverer.id },
            data:  { region: 'Norte' },
        });
        expect(result).toMatchObject({ region: 'Norte' });
    });
});

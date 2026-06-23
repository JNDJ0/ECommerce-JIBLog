import DelivererService from '../../../src/domains/Deliverer/services/DelivererService';
import { QueryError } from '../../../errors/QueryError';
import { InvalidParamError } from '../../../errors/InvalidParamError';
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
    deliverer: { findFirst: jest.Mock; create: jest.Mock; delete: jest.Mock; findMany: jest.Mock };
    user:      { findFirst: jest.Mock; create: jest.Mock; delete: jest.Mock };
    order:     { findMany: jest.Mock };
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

describe('DelivererService.findByUserId', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('deve retornar o entregador pelo userId', async () => {
        const deliverer = { id: 3, userId: 5, region: 'Norte' };
        prismaMock.deliverer.findFirst.mockResolvedValue(deliverer);

        const result = await DelivererService.findByUserId(5);

        expect(result).toEqual(deliverer);
        expect(prismaMock.deliverer.findFirst).toHaveBeenCalledWith({ where: { userId: 5 } });
    });
});

describe('DelivererService.findAll', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('deve retornar todos os entregadores', async () => {
        const deliverers = [{ id: 1, userId: 1, region: 'Sul', user: { name: 'A', email: 'a@test.com' } }];
        prismaMock.deliverer.findMany.mockResolvedValue(deliverers);

        const result = await DelivererService.findAll();

        expect(result).toEqual(deliverers);
        expect(prismaMock.deliverer.findMany).toHaveBeenCalledTimes(1);
    });
});

describe('DelivererService.findOrders', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('deve retornar pedidos do entregador com sucesso', async () => {
        const deliverer = { id: 3, userId: 5, region: 'Sul' };
        const orders    = [{ id: 10, code: 'ORD-01', delivererId: 3 }];

        prismaMock.deliverer.findFirst.mockResolvedValue(deliverer);
        prismaMock.order.findMany.mockResolvedValue(orders);

        const result = await DelivererService.findOrders(5);

        expect(result).toEqual(orders);
        expect(prismaMock.order.findMany).toHaveBeenCalledWith({ where: { delivererId: deliverer.id } });
    });

    it('deve lançar QueryError quando entregador não encontrado', async () => {
        prismaMock.deliverer.findFirst.mockResolvedValue(null);

        await expect(DelivererService.findOrders(99)).rejects.toThrow(QueryError);
        await expect(DelivererService.findOrders(99)).rejects.toThrow('Entregador não encontrado.');
    });
});

describe('DelivererService.updateRegion — entregador não encontrado', () => {
    beforeEach(() => { jest.clearAllMocks(); });

    it('deve lançar QueryError quando entregador não existe', async () => {
        prismaMock.deliverer.findFirst.mockResolvedValue(null);

        await expect(DelivererService.updateRegion(99, 'Norte')).rejects.toThrow(QueryError);
        await expect(DelivererService.updateRegion(99, 'Norte')).rejects.toThrow('Entregador não encontrado.');
    });
});

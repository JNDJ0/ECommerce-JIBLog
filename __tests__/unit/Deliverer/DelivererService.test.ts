import DelivererService from '../../../src/domains/Deliverer/services/DelivererService';
import { QueryError } from '../../../errors/QueryError';
import prisma from '../../../config/client';

const prismaMock = prisma as unknown as {
    deliverer: { findFirst: jest.Mock; delete: jest.Mock };
    user:      { delete: jest.Mock };
    $transaction: jest.Mock;
};

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

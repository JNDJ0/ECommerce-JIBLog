import { errorHandler } from '../../src/middlewares/errorHandler';
import { InvalidParamError } from '../../errors/InvalidParamError';
import { TokenError } from '../../errors/TokenError';
import { QueryError } from '../../errors/QueryError';
import { LoginError } from '../../errors/LoginError';
import { NotAuthorizedError } from '../../errors/NotAuthorizedError';
import { Request, Response, NextFunction } from 'express';

function makeRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  return res as Response;
}

const req  = {} as Request;
const next = jest.fn() as NextFunction;

describe('errorHandler — mapeamento de status por tipo de erro', () => {
  it('deve retornar 400 para InvalidParamError', () => {
    const res = makeRes();
    errorHandler(new InvalidParamError('param inválido'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('deve retornar 401 para TokenError', () => {
    const res = makeRes();
    errorHandler(new TokenError('token inválido'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('deve retornar 400 para QueryError', () => {
    const res = makeRes();
    errorHandler(new QueryError('não encontrado'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('deve retornar 409 para LoginError', () => {
    const res = makeRes();
    errorHandler(new LoginError('credenciais inválidas'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('deve retornar 403 para NotAuthorizedError', () => {
    const res = makeRes();
    errorHandler(new NotAuthorizedError('não autorizado'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('deve retornar 500 para erro genérico', () => {
    const res = makeRes();
    errorHandler(new Error('erro inesperado'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

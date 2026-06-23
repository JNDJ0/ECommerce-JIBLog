import prisma from '../../../../config/client';
import UserService from '../../User/services/UserService';
import { Owner, User} from '@prisma/client';
import { QueryError } from '../../../../errors/QueryError';

class OwnerService{
	async create(body: User){
		let user = await UserService.create(body, 'owner');

		const owner = await prisma.owner.create({
			data: {
				userId: user.id,
			}
		});

		await prisma.user.update({where: {id: user.id}, data: {ownerId: owner.id}});

		return owner;
	}

	async findByEmail(email: string){
		const user = await prisma.user.findFirst({where:{email: email}});

		if (!user) {
			throw new QueryError('Proprietário não encontrado.');
		}

		const owner = await prisma.owner.findFirst({where:{userId: user.id}});

		return owner;
	}

	async findOwners(){
		const owners = await prisma.user.findMany({where:{role: 'owner'}});

		return owners;
	}

	async findProductsByOwner(id: number){
		const owner = await prisma.owner.findFirst({where: {userId: id}});
		// console.log(owner);
		const products = await prisma.product.findMany({where: {ownerId: owner.id}});

		return products;
	}

	async updateOwner(email: string, body: User){

		const updatedUser = await prisma.user.update({
			where:{
				email: email,
			},
			data:{
				email: body.email,
				name: body.name,
				password: body.password,
			}
		});

		return updatedUser;
	}

	async deleteOwner(email: string){
	const user = await prisma.user.findFirst({where:{email: email}});

	if (!user) {
		throw new QueryError('Usuário não encontrado.');
	}

	const owner = await prisma.owner.findFirst({where:{userId: user.id}});

	if (!owner) {
		throw new QueryError('Proprietário não encontrado.');
	}

	await prisma.$transaction([
		prisma.product.deleteMany({
		where: {
			ownerId: owner.id,
		},
		}),
		prisma.owner.delete({
		where: {
			userId: user.id,
		},
		}),
		prisma.user.delete({
		where: {
			id: user.id,
		},
		})
	]);

	return;
	}
}

export default new OwnerService();
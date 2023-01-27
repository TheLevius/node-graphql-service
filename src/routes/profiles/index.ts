import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
		const result = await fastify.db.profiles.findMany();
		return result;
	});

	fastify.get(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<ProfileEntity> {
			const result = await fastify.db.profiles.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (result === null) {
				throw fastify.httpErrors.notFound();
			}
			return result;
		}
	);

	fastify.post(
		'/',
		{
			schema: {
				body: createProfileBodySchema,
			},
		},
		async function (request, reply): Promise<ProfileEntity> {
			const current = await fastify.db.users.findOne({
				key: 'id',
				equals: request.body.userId,
			});
			if (current === null) {
				throw fastify.httpErrors.badRequest();
			}
			const alreadyExistUser = await fastify.db.profiles.findOne({
				key: 'userId',
				equals: request.body.userId,
			});
			if (alreadyExistUser !== null) {
				throw fastify.httpErrors.badRequest();
			}
			const member = await fastify.db.memberTypes.findOne({
				key: 'id',
				equals: request.body.memberTypeId,
			});
			if (member === null) {
				throw fastify.httpErrors.badRequest();
			}
			const result = fastify.db.profiles.create(request.body);
			return result;
		}
	);

	fastify.delete(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<ProfileEntity> {
			const current = await fastify.db.profiles.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (current === null) {
				throw fastify.httpErrors.badRequest();
			}
			const result = await fastify.db.profiles.delete(current.id);
			return result;
		}
	);

	fastify.patch(
		'/:id',
		{
			schema: {
				body: changeProfileBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<ProfileEntity> {
			const current = await fastify.db.profiles.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (current === null) {
				throw fastify.httpErrors.badRequest();
			}
			const result = await fastify.db.profiles.change(
				request.params.id,
				request.body
			);
			return result;
		}
	);
};

export default plugin;

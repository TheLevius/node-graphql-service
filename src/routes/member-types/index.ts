import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.get('/', async function (request, reply): Promise<
		MemberTypeEntity[]
	> {
		const result = await fastify.db.memberTypes.findMany();
		return result;
	});

	fastify.get(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<MemberTypeEntity> {
			const result = await fastify.db.memberTypes.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (result === null) {
				throw fastify.httpErrors.notFound();
			}

			return result;
		}
	);

	fastify.patch(
		'/:id',
		{
			schema: {
				body: changeMemberTypeBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<MemberTypeEntity> {
			const currentMember = await fastify.db.memberTypes.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (currentMember === null) {
				throw fastify.httpErrors.badRequest();
			}
			const result = await fastify.db.memberTypes.change(
				request.params.id,
				{ ...request.body }
			);
			return result;
		}
	);
};

export default plugin;

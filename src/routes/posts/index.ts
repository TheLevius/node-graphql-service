import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
		const result = await fastify.db.posts.findMany();
		return result;
	});

	fastify.get(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<PostEntity> {
			const result = await fastify.db.posts.findOne({
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
				body: createPostBodySchema,
			},
		},
		async function (request, reply): Promise<PostEntity> {
			const result = await fastify.db.posts.create({ ...request.body });
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
		async function (request, reply): Promise<PostEntity> {
			const currentPost = await fastify.db.posts.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (currentPost === null) {
				throw fastify.httpErrors.badRequest();
			}
			const result = await fastify.db.posts.delete(request.params.id);
			return result;
		}
	);

	fastify.patch(
		'/:id',
		{
			schema: {
				body: changePostBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<PostEntity> {
			const currentPost = await fastify.db.posts.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (currentPost === null) {
				throw fastify.httpErrors.badRequest();
			}
			const result = await fastify.db.posts.change(request.params.id, {
				...request.body,
			});
			return result;
		}
	);
};

export default plugin;

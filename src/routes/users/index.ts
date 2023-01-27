import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
	createUserBodySchema,
	changeUserBodySchema,
	subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
		const result = await fastify.db.users.findMany();
		return result;
	});

	fastify.get(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const result = await fastify.db.users.findOne({
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
				body: createUserBodySchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const result = await fastify.db.users.create({ ...request.body });
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
		async function (request, reply): Promise<UserEntity> {
			try {
				const current = await fastify.db.users.findOne({
					key: 'id',
					equals: request.params.id,
				});
				if (current === null) {
					throw fastify.httpErrors.badRequest();
				}

				const users = await fastify.db.users.findMany();
				const subscribers = users.filter((user) =>
					user.subscribedToUserIds.some(
						(subId) => subId === current.id
					)
				);
				await Promise.all(
					subscribers.map((subscriber) => {
						return fastify.db.users.change(subscriber.id, {
							subscribedToUserIds:
								subscriber.subscribedToUserIds.filter(
									(sId) => sId !== current.id
								),
						});
					})
				);

				const posts = await fastify.db.posts.findMany();
				const postToDelete = posts.filter(
					(post) => post.userId === current.id
				);
				await Promise.all(
					postToDelete.map((post) => fastify.db.posts.delete(post.id))
				);
				const profiles = await fastify.db.profiles.findMany();
				const profilesToDelete = profiles.filter(
					(profile) => profile.userId === current.id
				);
				await Promise.all(
					profilesToDelete.map((profile) =>
						fastify.db.profiles.delete(profile.id)
					)
				);

				const result = await fastify.db.users.delete(request.params.id);
				return result;
			} catch (err) {
				throw fastify.httpErrors.badRequest();
			}
		}
	);

	fastify.post(
		'/:id/subscribeTo',
		{
			schema: {
				body: subscribeBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const current = await fastify.db.users.findOne({
				key: 'id',
				equals: request.params.id,
			});

			if (current === null) {
				throw fastify.httpErrors.badRequest();
			}

			const current2 = await fastify.db.users.findOne({
				key: 'id',
				equals: request.body.userId,
			});
			if (current2 === null) {
				throw fastify.httpErrors.badRequest();
			}

			const indexOfExist = current2.subscribedToUserIds.findIndex(
				(subId) => {
					subId === request.params.id;
				}
			);
			if (indexOfExist >= 0) {
				throw fastify.httpErrors.badRequest();
			}

			current2.subscribedToUserIds.push(current.id);
			const result = await fastify.db.users.change(request.body.userId, {
				subscribedToUserIds: current2.subscribedToUserIds,
			});

			return result;
		}
	);

	fastify.post(
		'/:id/unsubscribeFrom',
		{
			schema: {
				body: subscribeBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			try {
				const current = await fastify.db.users.findOne({
					key: 'id',
					equals: request.params.id,
				});

				if (current === null) {
					throw fastify.httpErrors.notFound();
				}
				const subOwner = await fastify.db.users.findOne({
					key: 'id',
					equals: request.body.userId,
				});
				if (subOwner === null) {
					throw fastify.httpErrors.badRequest();
				}
				const isSubOwner = subOwner.subscribedToUserIds.some(
					(userId) => userId === current.id
				);
				if (!isSubOwner) {
					throw fastify.httpErrors.badRequest;
				}
				const result = await fastify.db.users.change(subOwner.id, {
					subscribedToUserIds: subOwner.subscribedToUserIds.filter(
						(userId) => userId !== current.id
					),
				});
				return result;
			} catch (err) {
				throw fastify.httpErrors.badRequest();
			}
		}
	);

	fastify.patch(
		'/:id',
		{
			schema: {
				body: changeUserBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const current = await fastify.db.users.findOne({
				key: 'id',
				equals: request.params.id,
			});
			if (current === null) {
				throw fastify.httpErrors.badRequest();
			}
			const result = await fastify.db.users.change(
				request.params.id,
				request.body
			);
			return result;
		}
	);
};

export default plugin;

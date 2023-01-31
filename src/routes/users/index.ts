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

				const users = fastify.db.users.findMany({
					key: 'subscribedToUserIds',
					inArray: current.id,
				});
				const postsToDelete = fastify.db.posts.findMany({
					key: 'userId',
					equals: current.id,
				});
				const profilesToDelete = fastify.db.profiles.findMany({
					key: 'userId',
					equals: current.id,
				});
				const [foundUsers, foundPostsToDelete, foundProfilesToDelete] =
					await Promise.all([users, postsToDelete, profilesToDelete]);
				const updateSubs = Promise.all(
					foundUsers.map((user) => {
						return fastify.db.users.change(user.id, {
							subscribedToUserIds:
								user.subscribedToUserIds.filter(
									(sId) => sId !== current.id
								),
						});
					})
				);

				const deletePosts = Promise.all(
					foundPostsToDelete.map((post) =>
						fastify.db.posts.delete(post.id)
					)
				);

				const deleteProfiles = Promise.all(
					foundProfilesToDelete.map((profile) =>
						fastify.db.profiles.delete(profile.id)
					)
				);
				await Promise.all([updateSubs, deletePosts, deleteProfiles]);

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

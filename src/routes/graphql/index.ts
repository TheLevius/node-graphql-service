import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import DataLoader = require('dataloader');
import { FastifyInstance } from 'fastify';
import {
	graphql,
	GraphQLID,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLInputObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLOutputType,
} from 'graphql';
import { graphqlBodySchema } from './schema';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.post(
		'/',
		{
			schema: {
				body: graphqlBodySchema,
			},
		},

		async function (request, reply) {
			const MemberType = new GraphQLObjectType({
				name: 'MemberType',
				description: 'MemberType type object',
				fields: () => ({
					id: { type: new GraphQLNonNull(GraphQLString) },
					discount: { type: new GraphQLNonNull(GraphQLInt) },
					monthPostsLimit: { type: new GraphQLNonNull(GraphQLInt) },
				}),
			});

			const PostType = new GraphQLObjectType({
				name: 'Post',
				fields: {
					id: { type: GraphQLID },
					title: { type: new GraphQLNonNull(GraphQLString) },
					content: { type: new GraphQLNonNull(GraphQLString) },
					userId: { type: new GraphQLNonNull(GraphQLString) },
				},
			});
			const ProfileType = new GraphQLObjectType({
				name: 'Profile',
				description: 'Profile type object',
				fields: () => ({
					id: { type: new GraphQLNonNull(GraphQLID) },
					avatar: { type: new GraphQLNonNull(GraphQLString) },
					sex: { type: new GraphQLNonNull(GraphQLString) },
					birthday: { type: new GraphQLNonNull(GraphQLString) },
					country: { type: new GraphQLNonNull(GraphQLString) },
					street: { type: new GraphQLNonNull(GraphQLString) },
					city: { type: new GraphQLNonNull(GraphQLString) },
					memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
					userId: { type: new GraphQLNonNull(GraphQLString) },
					memberType: {
						type: MemberType,
						description: 'MemberType object',
						resolve: (profile) =>
							fastify.db.memberTypes.findOne({
								key: 'id',
								equals: profile.memberTypeId,
							}),
					},
				}),
			});
			const UserType: GraphQLOutputType = new GraphQLObjectType({
				name: 'User',
				fields: () => ({
					id: { type: GraphQLID },
					firstName: { type: new GraphQLNonNull(GraphQLString) },
					lastName: { type: new GraphQLNonNull(GraphQLString) },
					email: { type: new GraphQLNonNull(GraphQLString) },
					subscribedToUserIds: {
						type: new GraphQLList(GraphQLString),
					},
					userSubscribedTo: {
						type: new GraphQLList(UserType),
						resolve: async (
							user,
							_,
							{ fastify, dataloaders }: MyContext,
							info
						) => {
							const userSubscribedToUsers =
								await fastify.db.users.findMany({
									key: 'subscribedToUserIds',
									inArray: user.id,
								});
							return userSubscribedToUsers;
						},
					},
					subscribedToUser: {
						type: new GraphQLList(UserType),
						resolve: async (
							user,
							__,
							{ fastify, dataloaders }: MyContext,
							info
						) => {
							const userSubscribedToUsers =
								await fastify.db.users.findMany({
									key: 'subscribedToUserIds',
									inArray: user.id,
								});
							return userSubscribedToUsers;
						},
					},
					posts: {
						type: new GraphQLList(PostType),
						resolve: async (
							user,
							_,
							{ fastify, dataloaders }: MyContext,
							info
						) => {
							let dl: any = dataloaders.get(info.fieldNodes);
							if (!dl) {
								dl = new DataLoader(async (ids: any) => {
									const rows =
										await fastify.db.posts.findMany({
											key: 'userId',
											equalsAnyOf: ids,
										});
									const sortedInIdsOrder = ids.map(
										(id: any) =>
											rows.filter((p) => p.userId === id)
									);
									return sortedInIdsOrder;
								});
								dataloaders.set(info.fieldNodes, dl);
							}
							return dl.load(user.id);
							// return await fastify.db.posts.findMany({
							// 	key: 'userId',
							// 	equals: user.id,
							// });
						},
					},
					profile: {
						type: ProfileType,
						resolve: async (
							user,
							_,
							{ fastify, dataloaders }: MyContext,
							info
						) => {
							return await fastify.db.profiles.findOne({
								key: 'userId',
								equals: user.id,
							});
						},
					},
				}),
			});

			const query = new GraphQLObjectType({
				name: 'Query',
				description: 'rootQuery',
				fields: {
					users: {
						type: new GraphQLList(UserType),
						description: 'Users Table',
						resolve: async (_, __, { fastify }: MyContext) => {
							return await fastify.db.users.findMany();
						},
					},
					posts: {
						type: new GraphQLList(PostType),
						description: 'Posts Table',
						resolve: async (_, __, { fastify }: MyContext) => {
							return await fastify.db.posts.findMany();
						},
					},
					profiles: {
						type: new GraphQLList(ProfileType),
						description: 'Profiles Table',
						resolve: async (_, __, { fastify }: MyContext) => {
							return await fastify.db.profiles.findMany();
						},
					},
					memberTypes: {
						type: new GraphQLList(MemberType),
						description: 'Members table',
						resolve: async (_, __, { fastify }: MyContext) => {
							return await fastify.db.memberTypes.findMany();
						},
					},

					user: {
						type: UserType,
						args: { id: { type: new GraphQLNonNull(GraphQLID) } },
						resolve: async (_, { id }, { fastify }: MyContext) => {
							return await fastify.db.users.findOne({
								key: 'id',
								equals: id,
							});
						},
					},
					post: {
						type: PostType,
						args: { id: { type: new GraphQLNonNull(GraphQLID) } },
						resolve: async (_, { id }, { fastify }: MyContext) => {
							return await fastify.db.posts.findOne({
								key: 'id',
								equals: id,
							});
						},
					},
					profile: {
						type: ProfileType,
						args: { id: { type: new GraphQLNonNull(GraphQLID) } },
						resolve: async (_, { id }, { fastify }: MyContext) => {
							return await fastify.db.profiles.findOne({
								key: 'id',
								equals: id,
							});
						},
					},
					memberType: {
						type: MemberType,
						args: {
							id: { type: new GraphQLNonNull(GraphQLString) },
						},
						resolve: async (_, { id }, { fastify }: MyContext) => {
							return await fastify.db.memberTypes.findOne({
								key: 'id',
								equals: id,
							});
						},
					},
				},
			});

			const CreateUserDTO = new GraphQLInputObjectType({
				name: 'CreateUserDTO',
				fields: {
					firstName: { type: new GraphQLNonNull(GraphQLString) },
					lastName: { type: new GraphQLNonNull(GraphQLString) },
					email: { type: new GraphQLNonNull(GraphQLString) },
				},
			});
			const CreateProfileDTO = new GraphQLInputObjectType({
				name: 'CreateProfileDTO',
				fields: () => ({
					avatar: { type: new GraphQLNonNull(GraphQLString) },
					sex: { type: new GraphQLNonNull(GraphQLString) },
					birthday: { type: new GraphQLNonNull(GraphQLString) },
					country: { type: new GraphQLNonNull(GraphQLString) },
					street: { type: new GraphQLNonNull(GraphQLString) },
					city: { type: new GraphQLNonNull(GraphQLString) },
					userId: { type: new GraphQLNonNull(GraphQLID) },
					memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
				}),
			});
			const CreatePostDTO = new GraphQLInputObjectType({
				name: 'CreatePostDTO',
				fields: {
					title: { type: new GraphQLNonNull(GraphQLString) },
					content: { type: new GraphQLNonNull(GraphQLString) },
					userId: { type: new GraphQLNonNull(GraphQLID) },
				},
			});

			const ChangeUserDTO = new GraphQLInputObjectType({
				name: 'ChangeUserDTO',
				fields: {
					id: { type: new GraphQLNonNull(GraphQLID) },
					firstName: { type: GraphQLString },
					lastName: { type: GraphQLString },
					email: { type: GraphQLString },
					subscribedToUserIds: { type: new GraphQLList(GraphQLID) },
				},
			});
			const ChangeProfileDTO = new GraphQLInputObjectType({
				name: 'ChangeProfileDTO',
				fields: {
					id: { type: new GraphQLNonNull(GraphQLID) },
					avatar: { type: GraphQLString },
					sex: { type: GraphQLString },
					birthday: { type: GraphQLString },
					country: { type: GraphQLString },
					street: { type: GraphQLString },
					city: { type: GraphQLString },
					memberTypeId: { type: GraphQLString },
				},
			});
			const ChangePostDTO = new GraphQLInputObjectType({
				name: 'ChangePostDTO',
				fields: {
					id: { type: new GraphQLNonNull(GraphQLID) },
					title: { type: GraphQLString },
					content: { type: GraphQLString },
				},
			});
			const ChangeMemberTypeDTO = new GraphQLInputObjectType({
				name: 'ChangeMemberTypeDTO',
				fields: {
					id: { type: new GraphQLNonNull(GraphQLString) },
					discount: { type: GraphQLInt },
					monthPostsLimit: { type: GraphQLInt },
				},
			});
			const SubscribeToDTO = new GraphQLInputObjectType({
				name: 'SubscribeToDTO',
				fields: {
					id: { type: new GraphQLNonNull(GraphQLID) },
					subscribeToId: { type: new GraphQLNonNull(GraphQLID) },
				},
			});
			const UnsubscribeFromDTO = new GraphQLInputObjectType({
				name: 'UnsubscribeFromDTO',
				fields: {
					id: { type: new GraphQLNonNull(GraphQLID) },
					unsubscribeFromId: { type: new GraphQLNonNull(GraphQLID) },
				},
			});

			const mutation = new GraphQLObjectType({
				name: 'Mutation',
				description: 'rootMutation',
				fields: () => ({
					createUser: {
						type: UserType,
						args: { input: { type: CreateUserDTO } },
						resolve: async (
							_,
							{ input },
							{ fastify }: MyContext
						) => {
							const createdUser = await fastify.db.users.create(
								input
							);
							return createdUser;
						},
					},
					createPost: {
						type: PostType,
						args: { input: { type: CreatePostDTO } },
						resolve: async (
							_,
							{ input },
							{ fastify }: MyContext
						) => {
							const createdPost = await fastify.db.posts.create(
								input
							);
							return createdPost;
						},
					},
					createProfile: {
						type: ProfileType,
						args: { input: { type: CreateProfileDTO } },
						resolve: async (
							_,
							{ input },
							{ fastify }: MyContext
						) => {
							const createdProfile =
								await fastify.db.profiles.create(input);
							return createdProfile;
						},
					},
					changeUser: {
						type: UserType,
						args: { input: { type: ChangeUserDTO } },
						resolve: async (
							_,
							{ input: { id, ...input } },
							{ fastify }: MyContext
						) => {
							const updatedUser = await fastify.db.users.change(
								id,
								input
							);
							return updatedUser;
						},
					},
					changePost: {
						type: PostType,
						args: { input: { type: ChangePostDTO } },
						resolve: async (
							_,
							{ input: { id, ...input } },
							{ fastify }: MyContext
						) => {
							const updatedPost = await fastify.db.posts.change(
								id,
								input
							);
							return updatedPost;
						},
					},
					changeProfile: {
						type: ProfileType,
						args: { input: { type: ChangeProfileDTO } },
						resolve: async (
							_,
							{ input: { id, ...input } },
							{ fastify }: MyContext
						) => {
							const updatedProfile =
								await fastify.db.profiles.change(id, input);
							return updatedProfile;
						},
					},
					changeMemberType: {
						type: MemberType,
						args: { input: { type: ChangeMemberTypeDTO } },
						resolve: async (
							_,
							{ input: { id, ...input } },
							{ fastify }: MyContext
						) => {
							const updatedMemberType =
								await fastify.db.memberTypes.change(id, input);
							return updatedMemberType;
						},
					},
					subscribeTo: {
						type: UserType,
						args: { input: { type: SubscribeToDTO } },
						resolve: async (
							_,
							{ input: { id, subscribeToId } },
							{ fastify }: MyContext
						) => {
							const user = await fastify.db.users.findOne({
								key: 'id',
								equals: subscribeToId,
							});

							if (user === null) {
								throw fastify.httpErrors.badRequest();
							}
							const { subscribedToUserIds } = user;
							subscribedToUserIds.push(id);
							const updatedUser = await fastify.db.users.change(
								subscribeToId,
								{ subscribedToUserIds }
							);
							return updatedUser;
						},
					},

					unsubscribeFrom: {
						type: UserType,
						args: { input: { type: UnsubscribeFromDTO } },
						resolve: async (
							_,
							{ input: { id, unsubscribeFromId } },
							{ fastify }: MyContext
						) => {
							const user = await fastify.db.users.findOne({
								key: 'id',
								equals: unsubscribeFromId,
							});
							if (user === null) {
								throw fastify.httpErrors.badRequest();
							}
							const { subscribedToUserIds } = user;
							const filteredSubscribedToUserIds =
								subscribedToUserIds.filter(
									(userId) => userId !== id
								);
							const updatedUser = await fastify.db.users.change(
								unsubscribeFromId,
								{
									subscribedToUserIds:
										filteredSubscribedToUserIds,
								}
							);
							return updatedUser;
						},
					},
				}),
			});

			const schema = new GraphQLSchema({ query, mutation });
			type MyContext = {
				fastify: FastifyInstance;
				dataloaders: WeakMap<object, unknown>;
			};
			return await graphql({
				schema,
				source: !!request.body?.query
					? request.body.query!
					: request.body.mutation!,
				contextValue: { fastify, dataloaders: new WeakMap() },
				variableValues: request.body.variables,
			});
		}
	);
};

export default plugin;

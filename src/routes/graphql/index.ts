import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
	graphql,
	GraphQLID,
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from 'graphql';
import DB from '../../utils/DB/DB';
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
					id: { type: GraphQLID },
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
			const UserType = new GraphQLObjectType({
				name: 'User',
				fields: () => ({
					id: { type: GraphQLID },
					firstName: { type: new GraphQLNonNull(GraphQLString) },
					lastName: { type: new GraphQLNonNull(GraphQLString) },
					email: { type: new GraphQLNonNull(GraphQLString) },
					subscribedToUserIds: {
						type: new GraphQLList(GraphQLString),
					},
					userSubscribedToIds: {
						type: new GraphQLList(GraphQLString),
						resolve: async (user, _, db: DB) => {
							const userSubscribedToUsers =
								await db.users.findMany({
									key: 'subscribedToUserIds',
									inArray: user.id,
								});
							return userSubscribedToUsers.map((user) => user.id);
						},
					},
					posts: {
						type: new GraphQLList(PostType),
						resolve: async (user, _, db: DB) =>
							await db.posts.findMany({
								key: 'userId',
								equals: user.id,
							}),
					},
					profile: {
						type: ProfileType,
						resolve: async (user, _, db: DB) =>
							await db.profiles.findOne({
								key: 'userId',
								equals: user.id,
							}),
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
						resolve: async (_, __, db: DB) =>
							await db.users.findMany(),
					},
					// posts: {
					// 	type: new GraphQLList(PostType),
					// 	description: 'Posts Table',
					// 	resolve: async (_, __, db: DB) =>
					// 		await db.posts.findMany(),
					// },
					// profiles: {
					// 	type: new GraphQLList(ProfileType),
					// 	description: 'Profiles Table',
					// 	resolve: async (_, __, db: DB) =>
					// 		await db.profiles.findMany(),
					// },
					// memberTypes: {
					// 	type: new GraphQLList(MemberType),
					// 	description: 'Members table',
					// 	resolve: async (_, __, db: DB) =>
					// 		await db.memberTypes.findMany(),
					// },

					// user: {
					// 	type: new GraphQLNonNull(UserType),
					// 	resolve: async (_, { id }, db: DB) =>
					// 		await db.users.findOne({
					// 			key: 'id',
					// 			equals: id,
					// 		}),
					// },
					// post: {
					// 	type: new GraphQLNonNull(PostType),
					// 	resolve: async (_, { id }, db: DB) =>
					// 		await db.posts.findOne({
					// 			key: 'id',
					// 			equals: id,
					// 		}),
					// },
					// profile: {
					// 	type: new GraphQLNonNull(ProfileType),
					// 	resolve: async (_, { id }, db: DB) =>
					// 		await db.profiles.findOne({
					// 			key: 'id',
					// 			equals: id,
					// 		}),
					// },
					// memberType: {
					// 	type: new GraphQLNonNull(MemberType),
					// 	args: {
					// 		id: { type: GraphQLString },
					// 	},
					// 	resolve: async (_, { id }, db: DB) =>
					// 		await db.memberTypes.findOne({
					// 			key: 'id',
					// 			equals: id,
					// 		}),
					// },
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

			const mutation = new GraphQLObjectType({
				name: 'Mutation',
				description: 'rootMutation',
				fields: () => ({
					createUser: {
						type: UserType,
						args: { input: { type: CreateUserDTO } },
						resolve: async (_, { input }, db: DB) => {
							const createdUser = await db.users.create(input);
							return createdUser;
						},
					},
					createPost: {
						type: PostType,
						args: { input: { type: CreatePostDTO } },
						resolve: async (_, { input }, db: DB) => {
							const createdPost = await db.posts.create(input);
							return createdPost;
						},
					},
					createProfile: {
						type: ProfileType,
						args: { input: { type: CreateProfileDTO } },
						resolve: async (_, { input }, db: DB) => {
							const createdProfile = await db.profiles.create(
								input
							);
							return createdProfile;
						},
					},
					changeUser: {
						type: UserType,
						args: { input: { type: ChangeUserDTO } },
						resolve: async (
							_,
							{ input: { id, ...input } },
							db: DB
						) => {
							const updatedUser = await db.users.change(
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
							db: DB
						) => {
							const updatedPost = await db.posts.change(
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
							db: DB
						) => {
							const updatedProfile = await db.profiles.change(
								id,
								input
							);
							return updatedProfile;
						},
					},
				}),
			});

			const schema = new GraphQLSchema({ query, mutation });

			return await graphql({
				schema,
				source: !!request.body.query!
					? request.body.query!
					: request.body.mutation!,
				contextValue: fastify.db,
				variableValues: request.body.variables,
			});
		}
	);
};

export default plugin;

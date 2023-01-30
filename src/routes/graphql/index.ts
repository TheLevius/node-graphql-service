import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
	graphql,
	GraphQLID,
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
			// const MemberType = new GraphQLObjectType({
			// 	name: 'MemberType',
			// 	description: 'MemberType type object',
			// 	fields: () => ({
			// 		id: { type: GraphQLID },
			// 		discount: { type: new GraphQLNonNull(GraphQLInt) },
			// 		monthPostsLimit: { type: new GraphQLNonNull(GraphQLInt) },
			// 	}),
			// });

			// const PostType = new GraphQLObjectType({
			// 	name: 'Post',
			// 	description: 'Post type object',
			// 	fields: {
			// 		id: { type: GraphQLID },
			// 		title: { type: new GraphQLNonNull(GraphQLString) },
			// 		content: { type: new GraphQLNonNull(GraphQLString) },
			// 		userId: { type: new GraphQLNonNull(GraphQLString) },
			// 	},
			// });
			// const ProfileType = new GraphQLObjectType({
			// 	name: 'Profile',
			// 	description: 'Profile type object',
			// 	fields: () => ({
			// 		id: { type: new GraphQLNonNull(GraphQLID) },
			// 		avatar: { type: new GraphQLNonNull(GraphQLString) },
			// 		sex: { type: new GraphQLNonNull(GraphQLString) },
			// 		birthday: { type: new GraphQLNonNull(GraphQLString) },
			// 		country: { type: new GraphQLNonNull(GraphQLString) },
			// 		street: { type: new GraphQLNonNull(GraphQLString) },
			// 		city: { type: new GraphQLNonNull(GraphQLString) },
			// 		memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
			// 		userId: { type: new GraphQLNonNull(GraphQLString) },
			// 		memberType: {
			// 			type: MemberType,
			// 			description: 'MemberType object',
			// 			resolve: (profile) =>
			// 				fastify.db.memberTypes.findOne({
			// 					key: 'id',
			// 					equals: profile.memberTypeId,
			// 				}),
			// 		},
			// 	}),
			// });
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
					// posts: {
					// 	type: new GraphQLList(PostType),
					// 	resolve: async (user, _, db: DB) =>
					// 		await db.posts.findMany({
					// 			key: 'userId',
					// 			equals: user.id,
					// 		}),
					// },
					// profile: {
					// 	type: ProfileType,
					// 	resolve: async (user, _, db: DB) =>
					// 		await db.profiles.findOne({
					// 			key: 'userId',
					// 			equals: user.id,
					// 		}),
					// },
					// userSubscribedToProfiles: {
					// 	type: new GraphQLList(ProfileType),
					// 	resolve: async (currentUser, __, db: DB) => {
					// 		const userSubscribedToUsers =
					// 			await db.users.findMany({
					// 				key: 'subscribedToUserIds',
					// 				inArray: currentUser.id,
					// 			});
					// 		const userSubscribedToProfiles = await Promise.all(
					// 			userSubscribedToUsers.map((user) =>
					// 				db.profiles.findOne({
					// 					key: 'userId',
					// 					equals: user.id,
					// 				})
					// 			)
					// 		);
					// 		return userSubscribedToProfiles;
					// 	},
					// },
					// subscribedToUserPosts: {
					// 	type: new GraphQLList(PostType),
					// 	resolve: async (currentUser, __, db: DB) => {
					// 		const matrixUsersPosts = await Promise.all(
					// 			currentUser.subscribedToUserIds.map(
					// 				(id: string) =>
					// 					db.posts.findMany({
					// 						key: 'userId',
					// 						equals: id,
					// 					})
					// 			)
					// 		);
					// 		return matrixUsersPosts.flat(1);
					// 	},
					// },
				}),
			});

			// const CreatePost = new GraphQLObjectType({
			// 	name: 'createPost type',
			// 	fields: () => ({
			// 		title: { type: new GraphQLNonNull(GraphQLString) },
			// 		content: { type: new GraphQLNonNull(GraphQLString) },
			// 		userId: { type: new GraphQLNonNull(GraphQLID) },
			// 	}),
			// });
			// const CreateProfile = new GraphQLObjectType({
			// 	name: 'createProfile type',
			// 	fields: () => ({
			// 		avatar: { type: new GraphQLNonNull(GraphQLString) },
			// 		sex: { type: new GraphQLNonNull(GraphQLString) },
			// 		birthday: { type: new GraphQLNonNull(GraphQLString) },
			// 		country: { type: new GraphQLNonNull(GraphQLString) },
			// 		street: { type: new GraphQLNonNull(GraphQLString) },
			// 		city: { type: new GraphQLNonNull(GraphQLString) },
			// 		userId: { type: new GraphQLNonNull(GraphQLString) },
			// 		memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
			// 	}),
			// });

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

			// const CreateUser = new GraphQLObjectType({
			// 	name: 'CreateUser type',
			// 	fields: {
			// 		firstName: { type: new GraphQLNonNull(GraphQLString) },
			// 		lastName: { type: new GraphQLNonNull(GraphQLString) },
			// 		email: { type: new GraphQLNonNull(GraphQLString) },
			// 	},
			// });
			// const inputCreateUser = new GraphQLInputObjectType({
			// 	name: 'CreateUserInput',
			// 	fields: () => ({
			// 		firstName: { type: new GraphQLNonNull(GraphQLString) },
			// 		lastName: { type: new GraphQLNonNull(GraphQLString) },
			// 		email: { type: new GraphQLNonNull(GraphQLString) },
			// 	}),
			// });

			const mutation = new GraphQLObjectType({
				name: 'Mutation',
				description: 'rootMutation',
				fields: () => ({
					createUser: {
						type: UserType,
						args: {
							firstName: {
								type: new GraphQLNonNull(GraphQLString),
							},
							lastName: {
								type: new GraphQLNonNull(GraphQLString),
							},
							email: { type: new GraphQLNonNull(GraphQLString) },
						},
						resolve: async (
							_,
							{ firstName, lastName, email },
							db: DB
						) => {
							const createdUser = await db.users.create({
								firstName,
								lastName,
								email,
							});

							return createdUser;
						},
					},
					// createPost: {
					// 	type: CreatePost,
					// 	args: {
					// 		title: { type: GraphQLString },
					// 		content: { type: GraphQLString },
					// 		userId: { type: GraphQLID },
					// 	},
					// 	resolve: async (
					// 		_,
					// 		{ title, content, userId },
					// 		db: DB
					// 	) => {
					// 		const createdPost = await db.posts.create({
					// 			title,
					// 			content,
					// 			userId,
					// 		});
					// 		return createdPost;
					// 	},
					// },
					// createProfile: {
					// 	type: CreateProfile,
					// 	args: {
					// 		avatar: { type: GraphQLString },
					// 		sex: { type: GraphQLString },
					// 		birthday: { type: GraphQLString },
					// 		country: { type: GraphQLString },
					// 		street: { type: GraphQLString },
					// 		city: { type: GraphQLString },
					// 		userId: { type: GraphQLString },
					// 		memberTypeId: { type: GraphQLString },
					// 	},
					// 	resolve: async (
					// 		_,
					// 		{
					// 			avatar,
					// 			sex,
					// 			birthday,
					// 			country,
					// 			street,
					// 			city,
					// 			userId,
					// 			memberTypeId,
					// 		},
					// 		db: DB
					// 	) => {
					// 		const createdProfile = await db.profiles.create({
					// 			avatar,
					// 			sex,
					// 			birthday,
					// 			country,
					// 			street,
					// 			city,
					// 			userId,
					// 			memberTypeId,
					// 		});
					// 		return createdProfile;
					// 	},
					// },
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

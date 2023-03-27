const graphql = require("graphql");
const _ = require("lodash");

const {
	GraphQLInt,
	GraphQLObjectType,
	GraphQLString,
	GraphQLSchema,
	GraphQLID,
	GraphQLList,
	GraphQLNonNull,
} = graphql;

// dummy data
const users = require("./data/users");
const questions = require("./data/questions");
const answers = require("./data/answers");

const UserType = new GraphQLObjectType({
	name: "User",
	fields: () => ({
		userId: { type: GraphQLInt },
		userName: { type: GraphQLString },
		email: { type: GraphQLString },
		password: { type: GraphQLString },
		profileImage: { type: GraphQLString },
		asked: {
			type: new GraphQLList(QuestionType),
			resolve(parent, args) {
				return _.filter(questions, { ownerId: parent.userId });
			},
		},
		answered: {
			type: new GraphQLList(AnswerType),
			resolve(parent, args) {
				return _.filter(answers, { ownerId: parent.userId });
			},
		},
		hasRated: { type: new GraphQLList(GraphQLInt) },
		hasUpvoted: { type: new GraphQLList(GraphQLInt) },
		hasDownvoted: { type: new GraphQLList(GraphQLInt) },
	}),
});

const QuestionType = new GraphQLObjectType({
	name: "Question",
	fields: () => ({
		id: { type: GraphQLInt },
		title: { type: GraphQLString },
		description: { type: GraphQLString },
		owner: {
			type: UserType,
			resolve(parent, args) {
				return _.find(users, { userId: parent.ownerId });
			},
		},
		tags: { type: new GraphQLList(GraphQLString) },
		date: { type: GraphQLString },
		rating: { type: GraphQLString },
		answers: {
			type: new GraphQLList(AnswerType),
			resolve(parent, args) {
				return _.filter(answers, { qid: parent.id });
			},
		},
		attachments: { type: new GraphQLList(GraphQLString) },
	}),
});

const AnswerType = new GraphQLObjectType({
	name: "Answer",
	fields: () => ({
		id: { type: GraphQLInt },
		owner: {
			type: UserType,
			resolve(parent, args) {
				return _.find(users, { userId: parent.ownerId });
			},
		},
		content: { type: GraphQLString },
		qid: { type: GraphQLInt },
		question: {
			type: QuestionType,
			resolve(parent, args) {
				return _.find(questions, { id: parent.qid });
			},
		},
		date: { type: GraphQLString },
		upvotes: { type: GraphQLInt },
		downvotes: { type: GraphQLInt },
		attachments: { type: new GraphQLList(GraphQLString) },
	}),
});

const RootQuery = new GraphQLObjectType({
	name: "RootQueryType",
	fields: {
		user: {
			type: UserType,
			args: {
				id: { type: GraphQLInt },
			},
			resolve(parent, args) {
				return _.find(users, { userId: args.id });
			},
		},
		users: {
			type: new GraphQLList(UserType),
			resolve(parent, args) {
				return users;
			},
		},
		question: {
			type: QuestionType,
			args: {
				id: { type: GraphQLInt },
			},
			resolve(parent, args) {
				return _.find(questions, { id: args.id });
			},
		},
		questions: {
			type: new GraphQLList(QuestionType),
			args: {
				offset: { type: GraphQLInt },
				limit: { type: GraphQLInt },
			},
			resolve(parent, args) {
				console.log(args.offset, args.limit);
				if (args.offset !== undefined && args.limit !== undefined) {
					console.log("hh");
					if (args.offset + args.limit >= questions.length) {
						return questions.slice(args.offset, questions.length);
					} else {
						const hm = questions.slice(args.offset, args.limit + args.offset);
						console.log(hm, "hmmmm", questions.length);
						return hm;
					}
				} else {
					console.log("hhh");
					return questions;
				}
			},
		},
		answer: {
			type: AnswerType,
			args: {
				id: { type: GraphQLInt },
			},
			resolve(parent, args) {
				return _.find(answers, { id: args.id });
			},
		},
		answers: {
			type: new GraphQLList(AnswerType),
			resolve(parent, args) {
				return answers;
			},
		},
	},
});

const Mutation = new GraphQLObjectType({
	name: "Mutation",
	fields: {
		addUser: {
			type: UserType,
			args: {
				userName: { type: new GraphQLNonNull(GraphQLString) },
				email: { type: new GraphQLNonNull(GraphQLString) },
				password: { type: new GraphQLNonNull(GraphQLString) },
			},
			resolve(parent, args) {
				const user = {
					userId: (users.length + 1) * (users.length + 1),
					userName: args.userName,
					email: args.email,
					password: args.password,
					profileImage: "/profiles/unknown-user.png",
					asked: [],
					answered: [],
					hasRated: [],
					hasUpvoted: [],
					hasDownvoted: [],
				};
				users.push(user);
				return user;
			},
		},
		updateUserDetails: {
			type: UserType,
			args: {
				userId: { type: new GraphQLNonNull(GraphQLInt) },
				email: { type: GraphQLString },
				userName: { type: GraphQLString },
				password: { type: GraphQLString },
				profileImage: { type: GraphQLString },
			},
			resolve(parent, args) {
				const user = _.find(users, { userId: args.userId });
				const newUser = { ...user };
				if (args.email) newUser.email = args.email;
				if (args.userName) newUser.userName = args.userName;
				if (args.password) newUser.password = args.password;
				if (args.profileImage) newUser.profileImage = args.profileImage;

				const index = users.indexOf(user);
				users[index] = newUser;

				return newUser;
			},
		},
		deleteUser: {
			type: UserType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLInt) },
			},
			resolve(parent, args) {
				const user = _.find(users, { userId: args.id });
				const index = users.indexOf(user);
				users.splice(index, 1);
				return user;
			},
		},
		postQuestion: {
			type: QuestionType,
			args: {
				title: { type: new GraphQLNonNull(GraphQLString) },
				description: { type: new GraphQLNonNull(GraphQLString) },
				ownerId: { type: new GraphQLNonNull(GraphQLInt) },
				tags: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
				attachments: {
					type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
				},
			},
			resolve(parent, args) {
				const question = {
					id: questions.length,
					title: args.title,
					description: args.description,
					ownerId: args.ownerId,
					tags: args.tags,
					date: "",
					rating: 0,
					answers: [],
					attachments: args.attachments,
				};

				const user = _.find(users, { userId: args.ownerId });
				user.asked.push(question.id);

				questions.push(question);
				return question;
			},
		},
		updateQuestion: {
			type: QuestionType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLInt) },
				title: { type: GraphQLString },
				description: { type: GraphQLString },
				tags: { type: new GraphQLList(GraphQLString) },
				rating: { type: GraphQLInt },
				attachments: {
					type: new GraphQLList(GraphQLString),
				},
				currentUserId: { type: new GraphQLNonNull(GraphQLInt) },
			},
			resolve(parent, args) {
				const question = _.find(questions, { id: args.id });
				const currentUser = _.find(users, { userId: args.currentUserId });

				const newCurrentUser = { ...currentUser };
				const newQuestion = { ...question };

				if (args.title) newQuestion.title = args.title;
				if (args.description) newQuestion.description = args.description;
				if (args.tags) newQuestion.description = args.description;
				if (args.rating !== undefined) {
					newQuestion.rating = args.rating;
					if (newQuestion.rating > question.rating) {
						newCurrentUser.hasRated.push(newQuestion.id);
					} else {
						const index = newCurrentUser.hasRated.indexOf(question.id);
						if (index > -1) newCurrentUser.hasRated.splice(index, 1);
					}
				}
				if (args.attachments) newQuestion.attachments = args.attachments;

				const userIndex = users.indexOf(currentUser);
				users[userIndex] = newCurrentUser;

				const index = questions.indexOf(question);
				questions[index] = newQuestion;

				return newQuestion;
			},
		},
		deleteQuestion: {
			type: QuestionType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLInt) },
			},
			resolve(parent, args) {
				const question = _.find(questions, { id: args.id });
				const index = questions.indexOf(question);
				questions.splice(index, 1);
				return question;
			},
		},
		postAnswer: {
			type: AnswerType,
			args: {
				ownerId: { type: new GraphQLNonNull(GraphQLInt) },
				content: { type: new GraphQLNonNull(GraphQLString) },
				qid: { type: new GraphQLNonNull(GraphQLInt) },
				attachments: {
					type: new GraphQLNonNull(new GraphQLList(GraphQLString)),
				},
			},
			resolve(parent, args) {
				const answer = {
					id: answers.length,
					ownerId: args.ownerId,
					content: args.content,
					qid: args.qid,
					date: "",
					upvotes: 0,
					downvotes: 0,
					attachments: args.attachments,
				};

				const question = _.find(questions, { id: answer.qid });
				const user = _.find(users, { userId: args.ownerId });

				const newQuestion = { ...question, answers };
				question.answers.push(answer);
				user.answered.push(answer);

				answers.push(answer);
				return answer;
			},
		},
		updateAnswer: {
			type: AnswerType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLInt) },
				content: { type: GraphQLString },
				upvotes: { type: GraphQLInt },
				downvotes: { type: GraphQLInt },
				attachments: {
					type: new GraphQLList(GraphQLString),
				},
				currentUserId: { type: new GraphQLNonNull(GraphQLInt) },
			},
			resolve(parent, args) {
				const answer = _.find(answers, { id: args.id });
				const currentUser = _.find(users, { userId: args.currentUserId });

				const newCurrentUser = { ...currentUser };
				const newAnswer = { ...answer };

				if (args.content) newAnswer.content = args.content;
				if (args.upvotes !== undefined) {
					newAnswer.upvotes = args.upvotes;
					if (newAnswer.upvotes > answer.upvotes) {
						newCurrentUser.hasUpvoted.push(answer.id);
					} else if (newAnswer.upvotes < answer.upvotes) {
						const index = newCurrentUser.hasUpvoted.indexOf(answer.id);
						if (index > -1) newCurrentUser.hasUpvoted.splice(index, 1);
					}
				}
				if (args.downvotes !== undefined) {
					newAnswer.downvotes = args.downvotes;
					if (newAnswer.downvotes > answer.downvotes) {
						newCurrentUser.hasDownvoted.push(answer.id);
					} else if (newAnswer.downvotes < answer.downvotes) {
						const index = newCurrentUser.hasDownvoted.indexOf(answer.id);
						if (index > -1) newCurrentUser.hasDownvoted.splice(index, 1);
					}
				}
				if (args.attachments) newAnswer.attachments = args.attachments;

				const userIndex = users.indexOf(currentUser);
				users[userIndex] = newCurrentUser;

				const index = answers.indexOf(answer);
				answers[index] = newAnswer;
				return newAnswer;
			},
		},
		deleteAnswer: {
			type: AnswerType,
			args: {
				id: { type: new GraphQLNonNull(GraphQLInt) },
			},
			resolve(parent, args) {
				const answer = _.find(answers, { id: args.id });
				const index = answers.indexOf(answer);
				answers.splice(index, -1);
				return answer;
			},
		},
	},
});

module.exports = new GraphQLSchema({
	query: RootQuery,
	mutation: Mutation,
});

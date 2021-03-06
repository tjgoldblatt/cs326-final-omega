export class Database {
	private MongoClient = require('mongodb').MongoClient;
	private client;
	private collectionName: string;
	private dbName: string = 'omega';

	constructor(collectionName) {
		this.collectionName = collectionName;
		let secrets;
		let uri;
		if (!process.env.URI) {
			secrets = require('../secrets.json');
			uri = secrets.uri;
		} else {
			uri = process.env.URI;
		}

		this.client = new this.MongoClient(uri, { useUnifiedTopology: true }, { useNewUrlParser: true });
		// Open up a connection to the client.
		// The connection is asynchronous, but we can't call await directly
		// in the constructor, which cannot be async. So, we use "IIFE". Explanation below.

		/* from https://anthonychu.ca/post/async-await-typescript-nodejs/
	
		  Async/Await and the Async IIFE
	
		  The await keyword can only be used inside of a function
		  marked with the async keyword. [...] One way to do this is
		  with an "async IIFE" (immediately invoked function
		  expression)...
	
		   (async () => {
		   // code goes here
		   })();
	
		*/
		(async () => {
			await this.client.connect().catch((err) => {
				console.log(err);
			});
		})();
	}

	//PUT Functions
	public async putProject(
		projectName: string,
		projectDescription: string,
		projectWorkers: string,
		projectProgress: string,
		projectLinks: string,
		projectNumWorkers: string,
		projectButtons: []
	): Promise<void> {
		let db = this.client.db(this.dbName);
		let collection = db.collection(this.collectionName);

		// console.log("put: key = " + projectName + ", value = " + value);
		// insert one PROJECT into the database
		let result = await collection.updateOne(
			{ projectName: projectName },
			{
				$set: {
					projectDescription: projectDescription,
					projectWorkers: projectWorkers,
					projectProgress: projectProgress,
					projectLinks: projectLinks,
					projectNumWorkers: projectNumWorkers,
					projectButtons: projectButtons
				}
			},
			{ upsert: true }
		);
		console.log('result = ' + result);
	}
	public async putProfile(
		profileID: number,
		firstName: string,
		lastName: string,
		about: string,
		bio: string,
		email: string,
		links: string,
		password: string,
		project: string,
		skills: string[]
	): Promise<void> {
		let db = this.client.db(this.dbName);
		let collection = db.collection(this.collectionName);

		// console.log("put: key = " + projectName + ", value = " + value);
		// insert one profile into the database
		let result = await collection.updateOne(
			{ profileID: profileID },
			{
				$set: {
					profileEmail: email,
					profilePassword: password,
					firstName: firstName,
					lastName: lastName,
					profileBio: bio,
					profileAbout: about,
					profileProjects: project,
					profileLinks: links,
					skills: skills
				}
			},
			{ upsert: true }
		);
		console.log('result = ' + result);
	}

	public async updateProfile(
		firstName: string,
		lastName: string,
		bio: string,
		about: string,
		project: string,
		links: string,
		skills: string[]
	): Promise<void> {
		let db = this.client.db(this.dbName);
		let collection = db.collection(this.collectionName);

		// console.log("put: key = " + projectName + ", value = " + value);
		// insert one profile into the database
		let result = await collection.updateOne(
			{ lastName: lastName },
			{
				$set: {
					firstName: firstName,
					profileBio: bio,
					profileAbout: about,
					profileProjects: project,
					profileLinks: links,
					skills: skills
				}
			}
		);
		console.log('result of updateProfile DB operation= ' + result);
	}

	//GET Functions
	public async getProject(key: string): Promise<string> {
		let db = this.client.db(this.dbName); // this.level(this.dbFile);
		let collection = db.collection(this.collectionName);

		//Result is the JSON of the project in the DB associated with projectName
		let result = await collection.findOne({ projectName: key });

		//We want to return the whole JSON, not sure if that's what result.value is
		if (result) {
			return result;
		} else {
			return null;
		}
	}
	public async getProfile(key: string): Promise<string> {
		let db = this.client.db(this.dbName); // this.level(this.dbFile);
		let collection = db.collection(this.collectionName);

		//Find info of userProfile
		let result = await collection.findOne({ lastName: key });

		//We want to return the whole JSON, not sure if that's what result.value is
		if (result) {
			return result;
		} else {
			return null;
		}
	}

	//DEL Functions
	public async delProject(key: string): Promise<void> {
		let db = this.client.db(this.dbName);
		let collection = db.collection(this.collectionName);
		console.log("Deleting project with name: " + key);
		let result = await collection.deleteOne({ projectName: key });
	}

	public async delProfile(key: string): Promise<void> {
		let db = this.client.db(this.dbName);
		let collection = db.collection(this.collectionName);
		console.log("Deleting profile with last name: " + key);
		let result = await collection.deleteOne({ lastName: key });
	}

	//OTHER Functions
	public async find(): Promise<string> {
		let db = this.client.db(this.dbName);
		let collection = db.collection(this.collectionName);

		// returns all projects
		let projects: Array<string> = [];
		let result = await collection.find({ profileID: null }).toArray().then((items) => {
			console.log(`Successfully found ${items.length} documents.`);
			// console.log(items);
			projects.push(items);
			return items;
		});

		if (result) {
			console.log('result is not null');
			return projects[0];
		} else {
			return null;
		}
	}

	public async projectSearch(key: string): Promise<string> {
		let db = this.client.db(this.dbName);
		let collection = db.collection(this.collectionName);

		// returns all projects
		let projects: Array<string> = [];
		console.log('Searching for projects/profiles with name: ' + key);
		let projectResult = await collection.find({ projectName: key }).toArray().then((projList) => {
			console.log(`Successfully found ${projList.length} projects.`);
			// console.log(items);
			projects.push(projList);
			return projList;
		});
		console.log('projectResult: ' + projectResult);
		let profiles: Array<string> = [];
		let profileResult = await collection.find({ lastName: key }).toArray().then((profList) => {
			console.log(`Successfully found ${profList.length} profiles.`);
			// console.log(items);
			profiles.push(profList);
			return profList;
		});
		console.log('profileResult: ' + profileResult);

		//Check if 0 projects found, must have been a profile. If 0 profiles found, then invalid search
		if (projectResult.length !== 0) {
			console.log('result is a project');
			return projects[0];
		} else if (profileResult.length !== 0) {
			console.log('result is a profile');
			return profiles[0];
		} else {
			return null;
		}
	}

	//isFound function
	public async isFoundProj(key: string): Promise<boolean> {
		console.log('isFound: key = ' + key);
		let v = await this.getProject(key);
		console.log('is found result = ' + v);
		if (v === null) {
			return false;
		} else {
			return true;
		}
	}
	public async isFoundProf(key: string): Promise<boolean> {
		console.log('isFound: key = ' + key);
		let v = await this.getProfile(key);
		console.log('is found result = ' + v);
		if (v === null) {
			return false;
		} else {
			return true;
		}
	}
}

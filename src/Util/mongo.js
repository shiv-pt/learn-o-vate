const { MongoClient } = require('mongodb');
const toObject = (id) => {
    return id !== null && typeof id === 'object' ? id : { id };
}

class Mongo {
  constructor(){
    this.db = null;
  }
    async init() {
        const connection = {
            url: process.env.MONGO_URL,
            db: process.env.DB
        }

        if (!connection.url) throw Error('URL missing!')

        this.mongo = await MongoClient.connect(connection.url, { useUnifiedTopology: true })
            .then(mongo => {
                console.log('Connected to MongoDB');
                return mongo;
            }).catch(error => {
                console.error(`Connection failed due to ${error}`);
            });

        this.db = this.mongo.db(connection.db);
    }

    async set(collection, id, doc = {}) {
        return this.db.collection(collection).updateOne(toObject(id), {
            $set: {
                ...doc,
            }
        }, { upsert: true });
    }

    async get(collection, id, def) {
        if (!def) return this.db.collection(collection).findOne(toObject(id));

        // Check if exists
        let doc = await this.db.collection(collection).findOne(toObject(id));

        if (!doc) {
            doc = {
                ...toObject(id),
                ...def
            }

            await this.create(collection, id, def);
        }
        return doc;
    }
  
  async getAll(collection, id) {
    const docs = await this.db.collection(collection).find(id ? toObject(id) : {}).toArray();
    return docs;
  }

    async create(collection, id, doc = {}) {
        return this.db.collection(collection).insertOne({
            ...toObject(id),
            ...doc,
        });
    }

    async has(collection, id) {
        return this.get(collection, id).then(Boolean);
    }
}

module.exports = Mongo;
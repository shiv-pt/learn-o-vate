const bcrypt = require("bcrypt");

class Methods {
    constructor(mongo) {
        this.mongo = mongo;
    }

    async findUser(req, res) {
        const ID = req.cookies.ID;
        if (!ID) return false;
        const existingUser = await this.mongo.get("users", ID);
        if (!existingUser) {
            await res.clearCookie("ID");
            return false;
        } else {
            return existingUser;
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        const user = await this.mongo.db
            .collection("users")
            .findOne({ email: email });
        if (!user) return { error: "You don't have account" };
        const legitUser = await this._checkPassword(password, user.password);
        if (!legitUser) return { error: "Incorrect password" };
        await res.cookie("ID", user.ID, {
            maxAge: 1 * 60 * 60 * 1000
        });
        return { error: "", user: user };
    }

    async register(req, res) {
        const { email, password, username } = req.body;
        const user = await this.mongo.db
            .collection("users")
            .findOne({ email: email });
        if (user) return { error: "User already exists!" };
        const salt = await this._toHash(password);
        const id = this.randomID();
        await this.mongo.set("users", id, {
            ID: id,
            email: email,
            password: salt,
            username: username
        });
        await res.cookie("ID", id, {
            maxAge: 1 * 60 * 60 * 1000
        });
        return { error: "" };
    }

    async logOut(req, res) {
        const ID = req.cookies.ID;
        if (!ID) return false;
        await res.clearCookie("ID");
    }

    async isLoggedIn(req, res) {
        const exist = await this.findUser(req, res);
        if(exist) return true;
        else return false;
    }

    async getSubmission(req, res) {
        const ID = req.cookies.ID;
        const sub = await this.mongo.get("user-submissions", ID);
        return sub;
    }

    async addSubmission(req, res) {
        const { website } = req.body;
        const { ID } = req.cookies;
      
        const sub = await this.mongo.get("user-submissions", ID, require("./Util/defaults").submissions);
      try {
        if (!sub) {
            await this.mongo.set("user-submissions", ID, {
                count: 1,
                approved: [],
                pending: [{ name: website[0], link: website[1] }]
            });
        } else {
            const existingLinks = sub.pending;
            existingLinks.push({ name: website[0], link: website[1] });
            await this.mongo.set("user-submissions", ID, {
                count: ++sub.count || 1,
                pending: [...existingLinks]
            });
        }
            await this.mongo.create("submissions", ID, {
              link: website[1]
            });
        
        return true;
      }
      catch {
        return false;
      }
    }
  
  async delSubmission(req, res) {
    const { website } = req.body;
    const { ID } = req.cookies;
    
    const subs = await this.mongo.getAll('submissions', ID);
    const link = subs.length ? subs.filter(links => links.link === website) : null;
    if(!link) return { error: 'Coudn\'t find your submission!'};
    
    const userSub = await this.mongo.get('user-submissions', ID);
    const existInPending = userSub.pending.find(x => x.link === website);
    const existInApproved = userSub.approved.find(x => x.link === website);
    if(existInPending) {
      const filtered = userSub.pending.filter(x => x.link !== website);
      await this.mongo.set("user-submissions", ID, {
                count: userSub.count === 1 ? 0 : --userSub.count,
                pending: [...filtered]
            });
    }
    else if(existInApproved) {
      const filtered = userSub.approved.filter(x => x.link !== website);
      await this.mongo.set("user-submissions", ID, {
                count: userSub.count === 1 ? 0 : --userSub.count,
                approved: [...filtered]
            });
    }
    else return {error: "Coudn't find your submission!"};
    
    await this.mongo.db.collection("user-submissions").findOneAndDelete({ link: website }).catch();
    return {error: ""};
  }
  
  async checkForDupes(req, res) {
    const { website } = req.body;
    const { ID } = req.cookies;
    
    const subs = await this.mongo.getAll('submissions', ID);
    const exist = subs.find(x => x.link === website[1]);
    if(exist) return true 
    else return false;
  }

    randomID() {
        const chars = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let randchar = () => chars[Math.floor(Math.random() * chars.length)];
        let segment = () => randchar() + randchar() + randchar() + randchar();
        return segment();
    }

    async _toHash(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }

    async _checkPassword(password, hashedPash) {
        return bcrypt.compareSync(password, hashedPash);
    }
}

module.exports = Methods;

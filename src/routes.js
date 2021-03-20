const { Router } = require('express');
const Mongo = require('./Util/mongo');
const Methods = require('./methods');
const url = require('url');
const mongoService = new Mongo();

const router = Router();
async function init() {
    await mongoService.init();
}
init();

const method = new Methods(mongoService);

router.get('/', async(req, res) => {
    const user = await method.findUser(req, res);
    res.render('index', { user });
});

router.get('/signin', async(req, res) => {
    res.render('signin', { error: req.query.error });
});

router.get('/dashboard', async(req, res) => {
    const user = await method.findUser(req, res);
    if(!user) {
      return res.redirect('/signin');
    }
    const SUBS = await method.getSubmission(req, res);
    const subs = SUBS ? SUBS : { pending: [], approved: [] };
    res.render('dashboard', { user, subs });
});

router.get('/admin', (req, res) => {
  res.render('adminpage');
});

router.get('/del', async (req, res) => {
  req.body.website = 'http://hi.hi'
  await method.delSubmission(req, res);
});

router.get('/courses/:course', async(req, res) => {
    const user = await method.findUser(req, res);
    res.render(req.params.course, { user });
});

router.get('/logout', async(req, res) => {
    await method.logOut(req, res);
    return res.redirect('/');
});

/* ------------------------------------------------------------------------------------------------------*/
/* ----------------------------- POST METHODS -----------------------------------------------------------*/

router.post('/login', async(req, res) => {
    const response = await method.login(req, res);
    if (response) {
        if (response.error) return res.redirect(url.format({
            pathname: "/signin",
            query: {
                error: response.error
            }
        }));
        else res.redirect('/dashboard');
    }
});

router.post('/register', async(req, res) => {
    const response = await method.register(req, res);
    if (response) {
        if (response.error) return res.redirect(url.format({
            pathname: "/signin",
            query: {
                error: response.error
            }
        }));
        else req.returnURL ? res.redirect(req.returnURL) : res.redirect('/dashboard');
    }
});

router.post('/addSubmission', async(req, res) => {
    const loggedIn = await method.isLoggedIn(req, res);
    if (!loggedIn) {
        return res.redirect('/signin');
    }
    
    const dupeCheck = await method.checkForDupes(req, res); 
  if(dupeCheck) return res.redirect(url.format({
            pathname: "/dashboard",
            query: {
                error: 'This website was already submitted by someone else',
            }
  }));
    const success = await method.addSubmission(req, res);
    if (!success) {
        return res.redirect(url.format({
            pathname: "/dashboard",
            query: {
                error: 'We got some error while adding your course'
            }
        }));
    } else res.redirect('/dashboard');
});

router.get('*', async(req, res) => {
    res.render('error')
});

module.exports = router;
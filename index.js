const cookieParser = require("cookie-parser");
const express = require('express');
const path = require('path');
const router = require('./src/routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(require('express-xml-bodyparser')());
app.use(cookieParser());

app.use('/assets', express.static(path.join('./public')));
app.set('public', path.join(__dirname, 'public'));
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

app.use('/', router);

app.listen(3000, () => {
    console.log('Server started @ http://localhost:8080');
});
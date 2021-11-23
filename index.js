const express = require('express');
const exphbs = require('express-handlebars');

const app = express();
const PORT = process.env.PORT || 3019;
const pg = require("pg");
const Pool = pg.Pool;
const avoShopper = require('./avo-shopper');
// enable the req.body object - to allow us to use HTML forms
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// enable the static folder...
app.use(express.static('public'));

// add more middleware to allow for templating support

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

let useSSL = false;
let local = process.env.LOCAL || false;
if (process.env.DATABASE_URL && !local) {
	useSSL = true;
}
const dbpool = new Pool({
	connectionString: process.env.DATABASE_URL || 'postgresql://codex:pg123@localhost:5432/avo_shopper',
	ssl: {
		useSSL,
		rejectUnauthorized: false
	}
});
const avoApp = avoShopper(dbpool)

app.get('/', async function (req, res) {
	const topFiveDeals = await avoApp.topFiveDeals()
	res.render('index', {
		topFive: topFiveDeals
	});
});
app.get('/addNewDeals', async function (req, res) {
	const listShops = await avoApp.listShops()
	res.render('addNewDeals', {
		shop: listShops
	});
});
app.post('/addNewDeals', async function (req, res) {
	const shopId = req.body.shops
	const qty = req.body.qty
	const price = req.body.price
	if (shopId, qty, price) {
		await avoApp.createDeal(shopId, qty, price)
		res.redirect('/')
	}
	else{
		res.redirect('/addNewDeals')
	}
})
app.get('/viewShops', async function (req, res) {
	const listShops = await avoApp.listShops()

	res.render('viewShops', {
		shop: listShops

	});
});
app.get('/viewShops/:id', async function (req, res) {
	const shopId = req.params.id;
	const avoDeals = await avoApp.dealsForShop(shopId)
	res.render('viewShops', {
		avoDeals: avoDeals
	})
})
app.get('/recommendedDeals', async function (req, res) {
	res.render('recommendedDeals');
});
app.post('/recommendedDeals', async function (req, res) {
	let deals = await avoApp.recommendDeals(req.body.price)
	res.render('recommendedDeals', {
		deals: deals
	});
})
app.get('/addShop', async function (req, res) {
	res.render('addShop');
});
app.post('/addShop', async function (req, res) {
	await avoApp.createShop(req.body.addShop)
	console.log(req.body.addShop);
	res.redirect('viewShops');
});
// start the server and start listening for HTTP request on the PORT number specified...
app.listen(PORT, function () {
	console.log(`AvoApp started on port ${PORT}`)
});
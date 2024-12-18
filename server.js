/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Hanson Chieu  
Student ID: 173632233
Date: December 11, 2024
Glitch Web App URL: https://web322-hansonchieu.glitch.me
GitHub Repository URL: https://github.com/HansonChieu/Web322-app
********************************************************************************/
const authData = require('./auth-service.js');
const clientSessions = require('client-sessions');
const express = require("express");
const app = express();
const path = require("path");
const storeService = require("./store-service");
const itemData = require("./store-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { addItem } = require("./store-service");
const ejsLayouts = require("express-ejs-layouts");
const bodyParser = require('body-parser');

cloudinary.config({
  cloud_name: "dogdadxjy",
  api_key: "521323328351949",
  api_secret: "qBua6FHPM6f2ob4ZLaLIuvKPOzE",
  secure: true,
});

const upload = multer(); // no { storage: storage } since we are not using disk storage

const expressLayouts = require("express-ejs-layouts");
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views')); 
app.set("view engine", "ejs");
app.use(ejsLayouts);
app.set("layout", "layouts/main");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(clientSessions({
  cookieName: "session", 
  secret: "web322-appHanson", 
  duration: 24 * 60 * 60 * 1000, 
  activeDuration: 1000 * 60,
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
      return res.redirect('/login'); 
  }else{
  next();
  }
}

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About", layout: "layouts/main" });
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "item" by category
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await itemData.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await itemData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { title: "Shop", layout: "layouts/main", data: viewData });
});

app.get("/shop/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await itemData.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the item by "id"
    viewData.item = await itemData.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await itemData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { title: "Shop", layout: "layouts/main", data: viewData });
});



app.get("/items/add", ensureLogin,async (req, res) => {
  try {
    const categories = await storeService.getCategories();
    res.render("addItem", {
      title: "Add New Item",
      layout: "layouts/main",
      categories, // Pass the resolved categories
    });
  } catch (error) {
    console.error(error);
    res.render("addItem", {
      title: "Add New Item",
      layout: "layouts/main",
      categories: [], // Fallback to an empty array on error
    });
  }
});

app.get("/items", ensureLogin, async (req, res) => {
  try {
    const { category, minDate } = req.query;
    let data;

    if (category && minDate) {
      data = await storeService.getItemsByCategoryAndDate(category, minDate);
    } else if (category) {
      data = await storeService.getItemsByCategory(category);
    } else if (minDate) {
      data = await storeService.getItemsByMinDate(minDate);
    } else {
      data = await storeService.getAllItems();
    }

    // Check if data has results
    if (data.length > 0) {
      res.render("items", { title: "Items", items: data });
    } else {
      res.render("items", { title: "Items", message: "No results", items: [] });
    }
  } catch (error) {
    console.error(error);
    res.render("posts", {
      title: "Items",
      message: "Error fetching items",
      items: [],
    });
  }
});

app.get("/item/:id", ensureLogin, async (req, res) => {
  try {
    const { id } = req.params;

    const itemId = Number(id);
    if (isNaN(itemId)) {
      return res
        .status(400)
        .json({ error: "Invalid ID format. Must be a number." });
    }

    const item = await storeService.getItemById(itemId);

    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }

    return res.json(item);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the item." });
  }
});

app.get("/categories", ensureLogin, (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      if (data && data.length > 0) {
        res.render("categories", { title: "Categories", categories: data });
      } else {
        res.render("categories", {
          title: "Categories",
          categories: [],
          message: "No results",
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.render("categories", {
        title: "Categories",
        categories: [],
        message: "Error fetching categories",
      });
    });
});

app.post("/items/add", ensureLogin, upload.single("featureImage"), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req).then((uploaded) => {
      processItem(uploaded.url);
    });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;
    storeService
      .addItem(req.body)
      .then(() => {
        res.redirect("/items");
      })
      .catch((error) => {
        console.error("Failed to add item:", error);
        res.status(500).send("Failed to add item.");
      });
  }
});

app.get('/categories/add', ensureLogin, (req, res) => {
  res.render('addCategory', { title: 'Add Categories' });
});


app.post('/categories/add', ensureLogin, (req, res) => {
  storeService.addCategory(req.body)  
      .then(() => {
          res.redirect('/categories'); 
      })
      .catch((error) => {
          res.status(500).send('Unable to add category: ' + error.message);
      });
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
  const categoryId = req.params.id;

  storeService.deleteCategoryById(categoryId)
      .then(() => {
          res.redirect('/categories'); 
      })
      .catch((error) => {
          res.status(500).send('Unable to Remove Category / Category not found');
      });
});

app.get('/items/delete/:id',ensureLogin, (req, res) => {
  const itemId = req.params.id;

  storeService.deletePostById(itemId)
      .then(() => {
          res.redirect('/items');  
      })
      .catch((error) => {
          res.status(500).send('Unable to Remove Item / Item not found');
      });
});

storeService.initialize()
.then(authData.initialize)
.then(function(){
  const HTTP_PORT = process.env.PORT || 8080;
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});


app.get("/login", (req, res) => {
  res.render('login', { errorMessage: "", session: req.session });
});

app.get("/register", (req, res) => {
  res.render('register', { errorMessage: "", successMessage: "", session: req.session });
});

app.post("/register", (req, res) => {
  authData.registerUser(req.body).then(() => {
      res.render('register', { successMessage: "User created", errorMessage: '', session: req.session });
  }).catch((err) => {
      res.render('register', { errorMessage: err, userName: req.body.userName, successMessage: null, session: req.session});
  });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body).then((user) => {
      req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory
      };
      res.redirect('/shop');
  }).catch((err) => {
      res.render('login', {errorMessage: err, userName: req.body.userName, session: req.session});
  });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render('userHistory');
});

app.use((req, res) => {
  res
    .status(404)
    .render("404", { title: "404 - Page Not Found", layout: "layouts/main" });
});


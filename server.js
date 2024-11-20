/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Hanson Chieu  
Student ID: 173632233
Date: November 20, 2024
Glitch Web App URL: https://web322-hansonchieu.glitch.me
GitHub Repository URL: https://github.com/HansonChieu/Web322-app
********************************************************************************/

const express = require("express");
const app = express(); 
const path = require("path");
const storeService = require("./store-service.js");
const itemData = require("./store-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const {addItem} = require('./store-service');
const ejsLayouts = require('express-ejs-layouts');

cloudinary.config({
  cloud_name: "dogdadxjy",
  api_key: "521323328351949",
  api_secret: "qBua6FHPM6f2ob4ZLaLIuvKPOzE",
  secure: true,
});

const upload = multer(); // no { storage: storage } since we are not using disk storage

const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts); 


app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

app.use(express.static("public"));

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});


app.get("/", (req, res) => {
  res.redirect("/shop"); 
});

app.get('/about', (req, res) => {
  res.render('about', {title: 'About', layout: 'layouts/main' }); 
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
  res.render("shop", { title: "Shop", layout: 'layouts/main', data: viewData });
});

app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned items by category
      if(req.query.category){
          // Obtain the published "items" by category
          items = await itemData.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "items"
          items = await itemData.getPublishedItems();
      }

      // sort the published items by itemDate
      items.sort((a,b) => new Date(b.itemDate) - new Date(a.itemDate));

      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the item by "id"
      viewData.item = await itemData.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await itemData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { title: "Shop", layout: 'layouts/main', data: viewData });
});

app.get('/items/add', (req, res) => {
  res.render('addItem', { title: 'Add New Item', layout: 'layouts/main' });
});


app.get("/items", async (req, res) => {
  try {
    const { category, minDate } = req.query;

    let data;
    
    if (category) {
      data = await storeService.getItemsByCategory(category);
    } else if (minDate) {
      data = await storeService.getItemsByMinDate(minDate);
    } else {
      data = await storeService.getAllItems();
    }
    res.render("items", { title: 'Items',items: data });

  } catch (error) {
    console.error(error);
    res.render("posts", { message: "no results" });
  }
});

app.get("/item/:id", async (req, res) => {
  try {
      const { id } = req.params; 

      const itemId = Number(id);
      if (isNaN(itemId)) {
          return res.status(400).json({ error: 'Invalid ID format. Must be a number.' });
      }

      const item = await storeService.getItemById(itemId);

      if (!item) {
          return res.status(404).json({ error: 'Item not found.' });
      }

      return res.json(item);

  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred while fetching the item.' });
  }
});

app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((data) => {
      res.render("categories", {title: "Categories", categories:
        data});
    })
    .catch((err) => {
      res.render("categories", {
        title: "Categories",
        categories: [],  
        message: "No results"  
      });
    });
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
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

app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found', layout: 'layouts/main' });
});

storeService
  .initialize()
  .then(() => {
    const HTTP_PORT = process.env.PORT || 8080; 
    app.listen(HTTP_PORT, () =>
      console.log(`server listening on: ${HTTP_PORT}`),
    );
  })
  .catch((error) => {
    console.error("Failed to initialize data:", error);
  });

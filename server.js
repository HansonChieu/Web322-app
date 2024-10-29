/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part * of this assignment has
been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Hanson Chieu  
Student ID: 173632233
Date: October 9, 2024
Glitch Web App URL: https://web322-hansonchieu.glitch.me
GitHub Repository URL: https://github.com/HansonChieu/Web322-app
********************************************************************************/

const express = require("express"); // "require" the Express module
const app = express(); // obtain the "app" object
const path = require("path");
const fs = require("fs");
const storeService = require("./store-service.js");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const {addItem} = require('./store-service');

cloudinary.config({
  cloud_name: "dogdadxjy",
  api_key: "521323328351949",
  api_secret: "qBua6FHPM6f2ob4ZLaLIuvKPOzE",
  secure: true,
});

const upload = multer(); // no { storage: storage } since we are not using disk storage

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/about"); // Redirect root to the /about route
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/about.html")); // Send about.html file
});

app.get("/shop", (req, res) => {
  storeService
    .getAllItems()
    .then((data) => {
      const publishedItems = data.filter((item) => item.published);
      res.json(publishedItems);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

app.get("/items/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "addItem.html"));
});

app.get("/items", async(req, res) => {
  try {
    const { category, minDate } = req.query;

    if (category) {
        const itemsByCategory = await storeService.getItemsByCategory(category);
        return res.json(itemsByCategory);
    }

    if (minDate) {
        const itemsByMinDate = await storeService.getItemsByMinDate(minDate);
        return res.json(itemsByMinDate);
    }

    const allItems = await storeService.getAllItems(); // Assuming you have this function
    return res.json(allItems);

} catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'An error occurred while fetching items.' });
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
      res.json(data);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
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
  res.status(404).send("Page Not Found");
});

storeService
  .initialize()
  .then(() => {
    const HTTP_PORT = process.env.PORT || 8080; // assign a port
    app.listen(HTTP_PORT, () =>
      console.log(`server listening on: ${HTTP_PORT}`),
    );
  })
  .catch((error) => {
    console.error("Failed to initialize data:", error);
  });

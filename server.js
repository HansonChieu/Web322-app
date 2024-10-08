const express = require('express'); // "require" the Express module
const app = express(); // obtain the "app" object
const path = require('path');
const fs= require('fs');
const storeService = require('./store-service.js');

app.use(express.static("public"));

app.get('/', (req,res)=>{
  res.redirect('/about');       // Redirect root to the /about route
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));    // Send about.html file
});

app.get('/shop', (req,res)=>{
 storeService.getAllItems()
  .then((data)=>{
    const publishedItems = data.filter(item => item.published);
    res.json(publishedItems);
  })
  .catch((err)=>{
    res.status(500).json({message: err}); 
  });
});

app.get('/items', (req,res)=>{
  storeService.getAllItems()
   .then((data)=>{
    res.json(data);
   })
   .catch((err)=>{
     res.status(500).json({message: err}); 
   });
 });

 app.get('/categories', (req,res)=>{
  storeService.getCategories()
   .then((data)=>{
     res.json(data);
   })
   .catch((err)=>{
     res.status(500).json({message: err}); 
   });
 });

app.use((req, res) => {
  res.status(404).send("Page Not Found"); 
});

storeService.initialize()
.then(()=>{
  const HTTP_PORT = process.env.PORT || 8080; // assign a port
  app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));
})
.catch((error) => {
  console.error("Failed to initialize data:", error);
});

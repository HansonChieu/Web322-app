const fs = require("fs");
let items = [];
let categories = [];

module.exports = {
  initialize: function () {
    return new Promise((resolve, reject) => {
      fs.readFile("./data/items.json", "utf8", (err, data) => {
        if (err) {
          reject("unable to read items file");
          return;
        }
        try {
          items = JSON.parse(data);
        } catch (parseErr) {
          reject("unable to parse items data");
          return;
        }
        fs.readFile("./data/categories.json", "utf8", (err, data) => {
          if (err) {
            reject("unable to read categories file");
            return;
          }

          try {
            categories = JSON.parse(data);
          } catch (parseErr) {
            reject("unable to parse categories data");
            return;
          }

          resolve("Data successfully loaded");
        });
      });
    });
  },

  getAllItems: function () {
    return new Promise((resolve, reject) => {
      if (items.length > 0) {
        resolve(items);
      } else {
        reject("no results returned");
      }
    });
  },

  getPublishedItems: function () {
    return new Promise((resolve, reject) => {
      const publishedItems = items.filter((item) => item.published === true);

      if (publishedItems.length > 0) {
        resolve(publishedItems);
      } else {
        reject("no results returned");
      }
    });
  },

  getCategories: function () {
    return new Promise((resolve, reject) => {
      if (categories.length > 0) {
        resolve(categories);
      } else {
        reject("no results returned");
      }
    });
  },

  addItem : function(itemData){
    return new Promise((resolve, reject) => {
    itemData.published = (itemData.published === undefined)? false : true;
    itemData.id = items.length + 1;
    items.push(itemData);
    resolve(itemData);
    });
  },

  getItemsByCategory: function(category){
    return new Promise ((resolve, reject)=>{
      const filteredItems = items.filter(item => item.category === parseInt(category,6));

      if(filteredItems.length > 0){
        resolve(filteredItems);
      }else{
        reject("no results returned");
      }
    });
  },

  getItemsByMinDate : function(minDateStr){
    return new Promise ((resolve, reject) =>{
      const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));

      if(filteredItems.length > 0){
        resolve(filteredItems);
      }else{
        reject("no results returned");
      }
    });
  },

  getItemById : function(id){
    return new Promise((resolve, reject)=>{
      const item = items.find(item=> item.id === parseInt(id));

      if(item){
        resolve(item);
      }else{
        reject("no result returned");
      }
    });
  },
  
  getPublishedItemsByCategory : function(category){
    return new Promise((resolve, reject) => {
      const publishedItems = items.filter((item) => item.published === true && item.category ==category);

      if (publishedItems.length > 0) {
        resolve(publishedItems);
      } else {
        reject("no results returned");
      }
    });
  },

  addItem : function(itemData) {
    
    const currentDate = new Date().toISOString().split('T')[0];  
    itemData.postDate = currentDate;
    
    items.push(itemData); 
}
};

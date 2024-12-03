const Sequelize = require("sequelize");
const { Op } = Sequelize;

var sequelize = new Sequelize("senecaDB", "senecaDB_owner", "oxTQIN2Pls7i", {
  host: "ep-quiet-king-a52huhby.us-east-2.aws.neon.tech",
  dialect: "postgres",
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
  query: { raw: true },
});

const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: "category" });

module.exports = {
  // Initialize function
  initialize: function () {
    return new Promise((resolve, reject) => {
      sequelize
        .sync()
        .then(() => resolve("Database synced successfully"))
        .catch((err) => reject("Unable to sync the database: " + err));
    });
  },

  // Get all items
  getAllItems: function () {
    return new Promise((resolve, reject) => {
      Item.findAll()
        .then((data) => resolve(data))
        .catch(() => reject("No results returned"));
    });
  },

  // Get items by category
  getItemsByCategory: function (categoryId) {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: { categoryId: categoryId },
      })
        .then((data) => resolve(data))
        .catch(() => reject("No results returned"));
    });
  },

  // Get items by minimum date
  getItemsByMinDate: function (minDateStr) {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: {
          postDate: {
            [Op.gte]: new Date(minDateStr),
          },
        },
      })
        .then((data) => resolve(data))
        .catch(() => reject("No results returned"));
    });
  },

  // Get item by ID
  getItemById: function (itemId) {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: { id: itemId },
      })
        .then((data) => resolve(data[0])) // Only return the first item
        .catch(() => reject("No results returned"));
    });
  },

  // Add item
  addItem: function (itemData) {
    return new Promise((resolve, reject) => {
      // Ensure "published" is true/false and replace empty values with null
      itemData.published = itemData.published ? true : false;
      for (let key in itemData) {
        if (itemData[key] === "") {
          itemData[key] = null;
        }
      }
      // Set postDate to current date
      itemData.postDate = new Date();

      // Create new item
      Item.create(itemData)
        .then(() => resolve("Item created successfully"))
        .catch(() => reject("Unable to create item"));
    });
  },

  // Get published items
  getPublishedItems: function () {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: { published: true },
      })
        .then((data) => resolve(data))
        .catch(() => reject("No results returned"));
    });
  },

  // Get published items by category
  getPublishedItemsByCategory: function (categoryId) {
    return new Promise((resolve, reject) => {
      Item.findAll({
        where: {
          published: true,
          categoryId: categoryId,
        },
      })
        .then((data) => resolve(data))
        .catch(() => reject("No results returned"));
    });
  },

  // Get categories
  getCategories: function () {
    return new Promise((resolve, reject) => {
      Category.findAll()
        .then((data) => resolve(data))
        .catch(() => reject("No results returned"));
    });
  },

  addCategory: function(categoryData) {
    return new Promise((resolve, reject) => {
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }
        Category.create(categoryData)
            .then(() => {
                resolve();
            })
            .catch(() => {
                reject("Unable to create category");
            });
    });
},

  deleteCategoryById:function (id) {
  return new Promise((resolve, reject) => {
      Category.destroy({
          where: { id: id }
      })
          .then(deletedRows => {
              if (deletedRows > 0) {
                  resolve(); 
              } else {
                  reject("Category not found"); 
              }
          })
          .catch(() => {
              reject("Unable to delete category"); 
          });
  });
},

  deletePostById: function(id) {
  return new Promise((resolve, reject) => {
      Item.destroy({
          where: { id: id }
      })
          .then(deletedRows => {
              if (deletedRows > 0) {
                  resolve(); 
              } else {
                  reject("Post not found"); 
              }
          })
          .catch(() => {
              reject("Unable to delete post"); 
          });
    });
  },
};

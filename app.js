//require all modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//connect with database
mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://admin-shweta:shweta20sahil@cluster0.vtowurn.mongodb.net/todoDB");

//create schema & collection
const itemSchema = mongoose.Schema({
    name: String
});
const Item = mongoose.model("item", itemSchema);

const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("list", listSchema);

const defaultItems = [];

//show all tasks
app.get("/", function (req, res) {
    Item.find({}, function (err, result) {
        if (err)
            console.log(err);
        else
            res.render("index", { title: "Today", tasks: result });
    });
});

//create custom list
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, result) {
        if (!err) {

            //if the custom list doesn't exists, then create it
            if (!result) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else
                res.render("index", { title: result.name, tasks: result.items });
        }
    });
});


//add new tasks
app.post("/", function (req, res) {
    const itemName = req.body.newTask;
    const listName = req.body.button;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    }
    else {
        List.findOne({ name: listName }, function (err, result) {
            result.items.push(item);
            result.save();
            res.redirect("/" + listName);
        });
    }
});

//delete a task
app.post("/delete", function (req, res) {
    const deleteItemID = req.body.deleteItem;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(deleteItemID, function (err) {
            if (err)
                console.log(err);
            else {
                console.log("successfully deleted !");
                res.redirect("/");
            }
        });
    }
    else {

        /*
        findOneAndUpdate(para1,para2,para3)
        para1->which list do you want to find
        para2->what update do you want to make
        para3->callback
        */
        List.findOneAndUpdate({ name: listName },
            { $pull: { items: { _id: deleteItemID } } },
            function (err, result) {
                if (err)
                    console.log(err);
                else
                    res.redirect("/" + listName);
            });
    }
});

app.listen(process.env.PORT || 5000, function (req, res) {
    console.log("server started at port : 5000");
});

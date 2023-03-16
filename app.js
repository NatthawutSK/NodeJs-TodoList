const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.set("view engine","ejs");
//สามารถใช้ app.use(express.json()); แทน body-parser ได้
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin:fitriza555@todo-list.josesk9.mongodb.net/?retryWrites=true&w=majority",{useNewUrlParser:true});

// create schema item
const itemsSchema = {
    name:String
}
//create model item
const Item = mongoose.model("Item",itemsSchema);

// default item 
const item1 = new Item({name:"task1"});
const item2 = new Item({name:"task2"});
const item3 = new Item({name:"task3"});
const defaultItems = [item1,item2,item3]

//create schema List
const listSchema= {
    name:String,
    items:[itemsSchema]
}
//create model List
const List = mongoose.model("List",listSchema);

// ถ้าไม่มี item อยู่เลย จะ add defaultitem ให้อัตโนมัติ
// ถ้ามีก็ให้ render ไปที่หน้า home พร้อมส่ง item ที่เจอ กับ list ทั้งหมด ไปแสดง
app.get("/home",(req,res)=>{
    Item.find({},(err,foundItem)=>{
        if(foundItem.length===0){
            Item.insertMany(defaultItems,(err)=>{
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully saved!");
                }
                res.redirect('/home');
            })
        }else{
            List.find({},(err,foundList)=>{
                res.render("index",{listTitle:"Today",newListItems:foundItem.reverse(), list:foundList});
                })
        }

    })
});




//รับ ค่ามาจาก form แล้วเพิ่ม item ไปใน database
app.post("/add",(req,res)=>{
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name:itemName
    });

    // check if เพื่อป้องกันการ redirect ไปหน้าอื่น
    //แล้ว save เข้า database
    if(listName === "Today"){
        item.save((err)=>{
            if(!err){
                console.log("Save item!");
                res.redirect("/home");
            }
        })
    } else{
        List.findOne({name:listName},(err,foundList)=>{
            if(!err){
                if(foundList){
                    foundList.items.push(item)
                    foundList.save()
                    res.redirect("/"+listName)
                }
            }
        })

    }

    
});


app.post("/delete",(req,res)=>{
    const checkedbox = req.body.checkbox;
    const listName = req.body.listName;
    // check if เพื่อป้องกันการ redirect ไปหน้าอื่น
    if(listName === "Today"){
        Item.findByIdAndDelete(checkedbox,(err)=>{
            if(err){
                console.log(err);
            }
            else{
                console.log("Deleted!");
                res.redirect("/home");
            }
        })
    } else{
        //เข้าไปหา ตัวที่ name ใน list ตรงกับ listName ที่มาจาก value input 
        //แล้วใช้ $pull ในการลบออกจาก array ที่ item._id ตรงตาม value ใน checkbox แล้ว update
        // แล้วก็ redirect ไป path นั้น
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedbox}}},(err,foundList)=>{
            if(!err){
                res.redirect("/"+listName)
            }
        })
    }
    
})


app.get('/:customList',(req,res) => {
    const customList = req.params.customList
    // หาตัวที่ /customList ตรงกับใน database 
    // ถ้าหาไม่เจอก็จะสร้าง list ใหม่ save to database แล้ว redirect ไป path นั้น
    // ถ้ามีอยู่แล้วหรือหาเจอก็จะ render index แล้ว เอาข้อมูลจากที่ใน list ที่เจอใส่ไปแทน
    List.findOne({name:customList},(err, found)=>{
        if(!err){
            if(!found){
                const list = new List({
                    name: customList,
                    items: defaultItems
                })
                list.save()
                res.redirect("/"+customList)
            } else{
                List.find({},(err,foundList)=>{
                    res.render("index",{listTitle:found.name,newListItems:found.items, list:foundList});
                })
            }       
        }
    })
})





app.listen(3000,()=>{
    console.log("App is running on port 3000");
});
import 'dotenv/config';
import express from 'express';

const app = express();

app.use(express.static("public"))
app.set("view engine","ejs")

const PORT = process.env.APP_PORT || 3000;

app.get('/',(req,res)=>{
    res.render("index")
})
app.get('/login',(req,res)=>{
    res.render('login')
})
app.get('/register',(req,res)=>{
    res.render('register')
})
app.get('/main', (req, res) => {
    res.render('consumerPage');
});
app.get('/market/dashboard',(req,res)=>{
    res.render('dashboard')
})
app.get('/market/addproduct',(req,res)=>{
    res.render('addproduct')
})
app.get('/market/product/edit',(req,res)=>{
    res.render('editproduct')
})
app.get('/cart',(req,res)=>{
    res.render('cart')
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${process.env.APP_PORT}`);
});
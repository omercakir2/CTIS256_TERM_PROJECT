import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.static("public"))
app.set("view engine","ejs")
const PORT = process.env.APP_PORT || 3000;


app.get('/', (req, res) => {
    res.render("consumerPage");
});


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${process.env.APP_PORT}`);
});
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { getSheetData, updateComments } = require("./googleSheets");
const { generateComment } = require("./gemini");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", (req, res) => {
  res.render("index", { url: "", sheetName: "", sheetData: null });
});

app.post("/submit", async (req, res) => {
  const { url, sheetName } = req.body;
  try {
    const result = await getSheetData(url, sheetName);
    if (result.success) {
      res.render("index", {
        url,
        sheetName,
        sheetData: result.data,
        headers: result.headers,
        lessonIndex: result.lessonIndex,
        lessonTitle: result.lessonTitle,
        error: null,
      });
    } else {
      res.render("index", {
        url,
        sheetName,
        sheetData: null,
        lessonIndex: null,
        lessonTitle: null,
        error: result.error,
      });
    }
  } catch (error) {
    res.render("index", {
      url,
      sheetName,
      sheetData: null,
      error: "Đã xảy ra lỗi khi xử lý yêu cầu của bạn",
    });
  }
});

// Route for generating comments using Gemini
app.post("/generate-comment", async (req, res) => {
  try {
    const { rowData } = req.body;
    const result = await generateComment(rowData);
    res.json(result);
  } catch (error) {
    res.json({
      success: false,
      error: "Không thể tạo nhận xét",
    });
  }
});

// Route for applying comments to Google Sheet
app.post("/apply-comments", async (req, res) => {
  try {
    const { url, sheetName, comments } = req.body;
    const result = await updateComments(url, sheetName, comments);
    res.json(result);
  } catch (error) {
    res.json({
      success: false,
      error: "Không thể cập nhật nhận xét vào sheet",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});

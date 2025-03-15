const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateComment(studentData) {
    try {
        const { 'Tên học viên': studentName, 'Nhận xét về buổi học': oldComment, 'BTVN': homeworkScore } = studentData;
        console.log(studentName, oldComment, homeworkScore);
        
        const prompt = `Hãy viết một đoạn nhận xét ngắn gọn, chuyên nghiệp và có tính khích lệ cho học sinh dựa trên thông tin sau:
        
        Tên học sinh: ${studentName}
        Điểm BTVN: ${homeworkScore}
        Nhận xét cũ: ${oldComment || 'Học tập tốt, thái độ tốt, cần phát huy'}
        
        Yêu cầu:
        1. Nhận xét cụ thể dựa trên điểm số, nếu điểm BTVN không có giá trị thì bỏ qua không nhận xét bài tập
        2. Nếu có nhận xét cũ, hãy tham khảo để đảm bảo tính liên tục trong việc theo dõi
        3. Đưa ra lời khuyên để cải thiện (nếu cần)
        4. Độ dài khoảng 2-3 câu
        5. Không sử dụng các câu từ mang nhiều cảm xúc, chủ yếu nhận xét và góp ý
        6. Câu văn tự nhiên, không được thảo mai, khách sáo
        
        Chỉ trả về nội dung nhận xét, không cần thêm các từ ngữ khác.`;

        // Get the generative model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            comment: text.trim()
        };
    } catch (error) {
        console.error('Error generating comment with Gemini:', error);
        return {
            success: false,
            error: 'Failed to generate comment with Gemini'
        };
    }
}

module.exports = { generateComment }; 
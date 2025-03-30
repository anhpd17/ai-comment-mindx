const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateComment(studentData) {
    console.log(studentData);
    
    try {
        // Build student information string from all available columns
        const studentInfo = Object.entries(studentData)
            .map(([key, value]) => {
                if(key.toLowerCase().includes('Nhận xét') && value.trim() === '') {
                    return `Nhận xét buổi học: Học tốt, thái độ tốt, cần phát huy`
                }
                return `${key}: ${value || 'Không có thông tin'}`
            })
            .join('\n        ');
        
        const prompt = `Hãy viết một đoạn nhận xét ngắn gọn, chuyên nghiệp và có tính khích lệ cho học sinh dựa trên thông tin sau:
        
        ${studentInfo}
        
        Yêu cầu:
        1. Nếu có nhận xét cũ (trong trường "Nhận xét về buổi học" nếu có), hãy tham khảo để đảm bảo tính liên tục trong việc theo dõi
        2. Đưa ra lời khuyên để cải thiện (nếu cần)
        3. Độ dài khoảng 2-3 câu
        4. Câu văn tự nhiên, không được thảo mai, khách sáo
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